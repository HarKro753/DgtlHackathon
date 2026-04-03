"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { ResultPanel } from "@/components/ResultPanel";
import { TweakPanel } from "@/components/TweakPanel";
import { useFestivalPlanner } from "@/hooks/useFestivalPlanner";

const Map = dynamic(() => import("@/components/Map").then((mod) => ({ default: mod.Map })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-800 animate-pulse rounded-lg" />,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Home() {
  const p = useFestivalPlanner();
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div className="relative h-screen bg-gray-900 text-white overflow-hidden">
      {/* Full-screen map */}
      <div className="absolute inset-0">
        <Map onAreaSelected={(...args) => { p.handleAreaSelected(...args); setPanelOpen(true); }} />
      </div>

      {/* Top bar — floating over map */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <header className="mx-4 mt-4 bg-gray-800/95 backdrop-blur rounded-xl px-5 py-3 shadow-lg pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold">DGTL Sustainable Event Planner</h1>
              <Link href="/data" className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300">Dataset</Link>
            </div>
            <div className="flex items-center gap-3">
              <select value={p.duration} onChange={(e) => p.handleDurationChange(Number(e.target.value))} className="bg-gray-700 rounded px-2 py-1 text-sm">
                {[1, 2, 3, 4, 5, 7].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
              </select>
              <select value={p.month} onChange={(e) => p.handleMonthChange(Number(e.target.value))} className="bg-gray-700 rounded px-2 py-1 text-sm">
                {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <div className="flex bg-gray-700 rounded-lg p-0.5">
              <button
                onClick={() => p.handleModeChange("visitors")}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${p.mode === "visitors" ? "bg-gray-500 text-white" : "text-gray-400"}`}
              >
                Set Renewable Target
              </button>
              <button
                onClick={() => p.handleModeChange("renewable")}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${p.mode === "renewable" ? "bg-gray-500 text-white" : "text-gray-400"}`}
              >
                Set Visitor Target
              </button>
            </div>

            {p.mode === "visitors" ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-gray-400">Min renewable</span>
                <input
                  type="range" min={0} max={100} step={5} value={p.targetRenewable}
                  onChange={(e) => p.handleRenewableTargetChange(Number(e.target.value))}
                  onMouseUp={p.handleRenewableTargetCommit} onTouchEnd={p.handleRenewableTargetCommit}
                  className="flex-1 max-w-48 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <span className="text-sm font-medium text-green-400 w-10">{p.targetRenewable}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Target visitors</span>
                <input
                  type="number" min={1000} max={200000} step={1000} value={p.targetVisitors}
                  onChange={(e) => p.handleVisitorTargetChange(Number(e.target.value))}
                  onBlur={p.handleVisitorTargetCommit}
                  onKeyDown={(e) => { if (e.key === "Enter") p.handleVisitorTargetCommit(); }}
                  className="w-24 bg-gray-700 rounded px-2 py-1 text-sm"
                />
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Sliding panel + toggle */}
      <div
        className={`absolute top-0 right-0 h-full z-[1000] flex transition-transform duration-300 ${
          panelOpen ? "translate-x-0" : "translate-x-[calc(100%-2rem)]"
        }`}
        style={{ width: "min(50vw, 700px)" }}
      >
        {/* Toggle tab */}
        <button
          onClick={() => setPanelOpen(!panelOpen)}
          className="self-center -ml-8 bg-gray-800/95 backdrop-blur hover:bg-gray-700 rounded-l-lg px-2 py-6 shadow-lg shrink-0"
        >
          <span className="text-gray-400 text-sm" style={{ writingMode: "vertical-rl" }}>
            {panelOpen ? "Close" : p.plan ? `${p.plan.max_visitors.toLocaleString()} visitors · ${p.plan.energy.renewable_percent}%` : "Results"}
          </span>
        </button>

        {/* Panel content */}
        <div className="flex-1 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 overflow-y-auto p-6 pt-8">
          <div className="space-y-6">
            <ResultPanel plan={p.plan} loading={p.loading} error={p.error} polygon={p.polygon} onApplyNudge={p.handleApplyNudge} />
            {p.plan && <TweakPanel plan={p.plan} onTweak={p.handleTweak} />}
          </div>
        </div>
      </div>
    </div>
  );
}

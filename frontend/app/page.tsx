"use client";

import dynamic from "next/dynamic";
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

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">DGTL Sustainable Event Planner</h1>
          <div className="flex items-center gap-3">
            <select value={p.duration} onChange={(e) => p.handleDurationChange(Number(e.target.value))} className="bg-gray-700 rounded px-2 py-1 text-sm">
              {[1, 2, 3, 4, 5, 7].map((d) => <option key={d} value={d}>{d} day{d > 1 ? "s" : ""}</option>)}
            </select>
            <select value={p.month} onChange={(e) => p.handleMonthChange(Number(e.target.value))} className="bg-gray-700 rounded px-2 py-1 text-sm">
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Mode + constraint */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => p.handleModeChange("visitors")}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${p.mode === "visitors" ? "bg-gray-500 text-white" : "text-gray-400"}`}
            >
              Max Visitors
            </button>
            <button
              onClick={() => p.handleModeChange("renewable")}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${p.mode === "renewable" ? "bg-gray-500 text-white" : "text-gray-400"}`}
            >
              Max Renewable
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

      {/* Map strip */}
      <div className="h-[30vh] min-h-[200px] border-b border-gray-700">
        <Map onAreaSelected={p.handleAreaSelected} />
      </div>

      {/* Data */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <ResultPanel plan={p.plan} loading={p.loading} error={p.error} polygon={p.polygon} onApplyNudge={p.handleApplyNudge} />
          {p.plan && <TweakPanel plan={p.plan} onTweak={p.handleTweak} />}
        </div>
      </div>
    </div>
  );
}

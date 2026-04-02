"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { ResultPanel } from "@/components/ResultPanel";
import { useFestivalPlan } from "@/hooks/useFestivalPlan";

const Map = dynamic(() => import("@/components/Map").then((mod) => ({ default: mod.Map })), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-800 animate-pulse rounded-lg" />,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Home() {
  const { plan, loading, error, fetchPlan } = useFestivalPlan();
  const [duration, setDuration] = useState(2);
  const [month, setMonth] = useState(4);
  const [selectedArea, setSelectedArea] = useState<{ lat: number; lng: number; area_m2: number } | null>(null);

  const handleAreaSelected = useCallback(
    (lat: number, lng: number, area_m2: number) => {
      setSelectedArea({ lat, lng, area_m2 });
      fetchPlan({ lat, lng, area_m2, duration_days: duration, month });
    },
    [duration, month, fetchPlan]
  );

  const handleParamChange = useCallback(
    (newDuration: number, newMonth: number) => {
      setDuration(newDuration);
      setMonth(newMonth);
      if (selectedArea) {
        fetchPlan({ ...selectedArea, duration_days: newDuration, month: newMonth });
      }
    },
    [selectedArea, fetchPlan]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700">
        <div>
          <h1 className="text-xl font-bold">DGTL Sustainable Event Planner</h1>
          <p className="text-sm text-gray-400">The land dictates the event, not the other way around</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Duration</label>
            <select
              value={duration}
              onChange={(e) => handleParamChange(Number(e.target.value), month)}
              className="bg-gray-700 rounded px-2 py-1 text-sm"
            >
              {[1, 2, 3, 4, 5, 7].map((d) => (
                <option key={d} value={d}>
                  {d} day{d > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Month</label>
            <select
              value={month}
              onChange={(e) => handleParamChange(duration, Number(e.target.value))}
              className="bg-gray-700 rounded px-2 py-1 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-3">
          <Map onAreaSelected={handleAreaSelected} />
        </div>
        <div className="w-[420px] border-l border-gray-700 p-4 overflow-y-auto">
          <ResultPanel plan={plan} loading={loading} error={error} />
        </div>
      </div>
    </div>
  );
}

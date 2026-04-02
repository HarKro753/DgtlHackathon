"use client";

import { useCallback, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { FestivalPlan } from "@/types/festival";
import type { PolygonPoint } from "@/components/Map";
import { EnergyChart } from "./EnergyChart";
import { fmt, renewableColor, renewableBg, SOURCE_COLORS } from "@/utils/format";
import { buildExportText } from "@/utils/export";

interface ResultPanelProps {
  plan: FestivalPlan | null;
  loading: boolean;
  error: string | null;
  polygon: PolygonPoint[];
  onApplyNudge: (action: string, value: number) => void;
}

function ResourceRow({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2">
      <span className="text-gray-300 text-sm">{label}</span>
      <div className="text-right">
        <span className="font-medium text-sm">{value}</span>
        <span className="text-xs text-gray-500 ml-2">({sub})</span>
      </div>
    </div>
  );
}

function EnergySourceChart({ plan }: { plan: FestivalPlan }) {
  const data = plan.energy.sources.map((s) => ({
    name: s.name, value: s.capacity_kWh, percent: s.share_percent,
  }));

  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
            {data.map((entry) => <Cell key={entry.name} fill={SOURCE_COLORS[entry.name] || "#6B7280"} />)}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${fmt(Number(value))} kWh`]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-3 text-xs">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SOURCE_COLORS[entry.name] || "#6B7280" }} />
            <span className="text-gray-400">{entry.name} {entry.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResultPanel({ plan, loading, error, polygon, onApplyNudge }: ResultPanelProps) {
  const [exported, setExported] = useState(false);

  const handleExport = useCallback(() => {
    if (!plan) return;
    navigator.clipboard.writeText(buildExportText(plan, polygon));
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }, [plan, polygon]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="text-lg animate-pulse">Calculating...</div></div>;
  }

  if (error) {
    return <div className="p-4 bg-red-900/50 rounded-lg"><p className="text-red-300">{error}</p></div>;
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-center">
        <div>
          <p className="text-lg">Select an area on the map</p>
          <p className="text-sm mt-1">Double-click to start drawing a polygon</p>
        </div>
      </div>
    );
  }

  const renewColor = renewableColor(plan.energy.renewable_percent);
  const renewBg = renewableBg(plan.energy.renewable_percent);

  return (
    <div className="space-y-6">
      {/* Header row: location + export */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold">{plan.location_name}</h2>
          <p className="text-xs text-gray-400">
            {fmt(plan.area_m2)} m² · {plan.duration_days} days · Month {plan.month}
            {plan.grid_congested && <span className="text-amber-400 ml-2">· Grid congested</span>}
          </p>
        </div>
        <button
          onClick={handleExport}
          className={`px-2.5 py-1 rounded text-xs transition-colors ${exported ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          {exported ? "Copied!" : "Export"}
        </button>
      </div>

      {/* Hero: two big numbers side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 text-center">
          <div className="text-4xl font-bold">{fmt(plan.max_visitors)}</div>
          <div className="text-sm text-gray-400 mt-1">visitors per day</div>
          {plan.duration_days > 1 && (
            <div className="text-xs text-gray-500 mt-0.5">{fmt(plan.max_visitors * plan.duration_days)} total over {plan.duration_days} days</div>
          )}
        </div>
        <div className={`${renewBg} border border-gray-700 rounded-lg p-5 text-center`}>
          <div className={`text-4xl font-bold ${renewColor}`}>{plan.energy.renewable_percent}%</div>
          <div className="text-sm text-gray-400 mt-1">renewable</div>
        </div>
      </div>

      {/* Nudges */}
      {plan.nudges.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {plan.nudges.map((nudge, i) => (
            <button
              key={i}
              onClick={() => onApplyNudge(nudge.action, nudge.value)}
              className="text-left px-3 py-2.5 bg-cyan-900/20 border border-cyan-800/30 hover:bg-cyan-900/40 rounded-lg transition-colors"
            >
              <div className="text-sm text-cyan-300">{nudge.message}</div>
              <div className="text-xs text-cyan-500/70 mt-0.5">{nudge.impact}</div>
            </button>
          ))}
        </div>
      )}

      {/* Energy section: chart + mix + infrastructure — 3 columns */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Energy ({fmt(plan.energy.total_supply_kWh)} kWh)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 24h dispatch chart — spans 2 cols */}
          <div className="lg:col-span-2">
            <EnergyChart plan={plan} />
          </div>
          {/* Source mix + infrastructure */}
          <div className="space-y-4">
            <EnergySourceChart plan={plan} />
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-lg font-bold text-cyan-400">{plan.energy.hydrogen_generators}</div>
                <div className="text-gray-500">H₂ gen</div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-lg font-bold text-purple-400">{plan.energy.battery_units}</div>
                <div className="text-gray-500">batteries</div>
              </div>
              <div className="bg-gray-800/50 rounded p-2">
                <div className="text-lg font-bold text-green-400">{plan.energy.grid_kw}</div>
                <div className="text-gray-500">kW grid</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resources + Cost — 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Resources</h3>
          <div className="space-y-1.5">
            <ResourceRow label="Water" value={`${fmt(plan.resources.water_liters_total)} L`} sub={`${plan.resources.water_liters_per_person} L/p/day`} />
            <ResourceRow label="Food" value={`${fmt(plan.resources.food_kg_total)} kg`} sub={`${plan.resources.food_kg_per_person} kg/p/day`} />
            <ResourceRow label="Drinks" value={`${fmt(plan.resources.drinks_kg_total)} kg`} sub={`${plan.resources.drinks_kg_per_person} kg/p/day`} />
            <ResourceRow label="Waste" value={`${fmt(plan.resources.waste_kg_total)} kg`} sub={`${plan.resources.waste_kg_per_person} kg/p/day`} />
            <ResourceRow label="Toilets" value={String(plan.resources.toilets_required)} sub="3 per 100" />
            <ResourceRow label="Human waste" value={`${fmt(plan.resources.human_waste_kg)} kg`} sub="2.84 kg/p/day" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Cost</h3>
          <div className="bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">H₂ generators</span><span>€{fmt(plan.cost.hydrogen_generators_eur)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Batteries</span><span>€{fmt(plan.cost.batteries_eur)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Grid connection</span><span>€{fmt(plan.cost.grid_connection_eur)}</span></div>
            <div className="border-t border-gray-700 pt-2 flex justify-between font-bold"><span>Total</span><span>€{fmt(plan.cost.total_eur)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

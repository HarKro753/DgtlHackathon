"use client";

import type { FestivalPlan } from "@/types/festival";
import { EnergyChart } from "./EnergyChart";

interface ResultPanelProps {
  plan: FestivalPlan | null;
  loading: boolean;
  error: string | null;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function StatCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-70">{unit}</div>
    </div>
  );
}

export function ResultPanel({ plan, loading, error }: ResultPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg animate-pulse">Calculating sustainable capacity...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 rounded-lg">
        <p className="text-red-300">Error: {error}</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-lg">Select an area on the map</p>
          <p className="text-sm mt-1">Hold Shift + drag to draw a rectangle</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto h-full p-1">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">{plan.location_name}</h2>
        <p className="text-sm text-gray-400">
          {formatNumber(plan.area_m2)} m² · {plan.duration_days} days · Month {plan.month}
        </p>
        {plan.grid_congested && (
          <div className="mt-2 px-3 py-1 bg-amber-900/50 text-amber-300 rounded text-sm inline-block">
            Grid congested — on-site renewables essential
          </div>
        )}
      </div>

      {/* Max visitors */}
      <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-6 text-center">
        <div className="text-sm text-green-400">Maximum Sustainable Capacity</div>
        <div className="text-5xl font-bold text-green-400 mt-2">
          {formatNumber(plan.max_visitors)}
        </div>
        <div className="text-sm text-green-400/70 mt-1">visitors at 100% renewable</div>
      </div>

      {/* Energy stats */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Energy</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Supply" value={formatNumber(plan.energy.total_supply_kWh)} unit="kWh" color="bg-blue-900/30" />
          <StatCard label="Solar Panels" value={formatNumber(plan.energy.solar_panels_count)} unit="panels" color="bg-yellow-900/30" />
          <StatCard label="Batteries" value={String(plan.energy.battery_units)} unit={`${formatNumber(plan.energy.battery_capacity_kWh)} kWh`} color="bg-purple-900/30" />
          <StatCard label="Renewable" value={`${plan.renewable_percent}%`} unit="" color="bg-green-900/30" />
        </div>

        {/* Energy sources bar */}
        <div className="mt-3">
          <div className="flex rounded-full overflow-hidden h-4">
            {plan.energy.sources.map((source) => {
              const colors: Record<string, string> = {
                Solar: "bg-yellow-500",
                Wind: "bg-blue-400",
                "Grid (renewable)": "bg-green-500",
              };
              return (
                <div
                  key={source.name}
                  className={`${colors[source.name] || "bg-gray-500"}`}
                  style={{ width: `${source.share_percent}%` }}
                  title={`${source.name}: ${source.share_percent}%`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            {plan.energy.sources.map((source) => (
              <span key={source.name}>{source.name} {source.share_percent}%</span>
            ))}
          </div>
        </div>
      </div>

      {/* Energy chart */}
      <EnergyChart plan={plan} />

      {/* Resources */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Resources Required</h3>
        <div className="space-y-2">
          <ResourceRow label="Water" value={`${formatNumber(plan.resources.water_liters_total)} L`} perPerson={`${plan.resources.water_liters_per_person} L/person/day`} />
          <ResourceRow label="Food" value={`${formatNumber(plan.resources.food_kg_total)} kg`} perPerson={`${plan.resources.food_kg_per_person} kg/person/day`} />
          <ResourceRow label="Drinks" value={`${formatNumber(plan.resources.drinks_kg_total)} kg`} perPerson={`${plan.resources.drinks_kg_per_person} kg/person/day`} />
          <ResourceRow label="Waste" value={`${formatNumber(plan.resources.waste_kg_total)} kg`} perPerson={`${plan.resources.waste_kg_per_person} kg/person/day`} />
          <ResourceRow label="Toilets" value={String(plan.resources.toilets_required)} perPerson="3 per 100 people" />
          <ResourceRow label="Human waste" value={`${formatNumber(plan.resources.human_waste_kg)} kg`} perPerson="2.84 kg/person/day" />
        </div>
      </div>

      {/* Cost */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Infrastructure Cost</h3>
        <div className="bg-gray-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Solar panels</span>
            <span>€{formatNumber(plan.cost.solar_panels_eur)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Batteries</span>
            <span>€{formatNumber(plan.cost.batteries_eur)}</span>
          </div>
          <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>€{formatNumber(plan.cost.total_eur)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceRow({ label, value, perPerson }: { label: string; value: string; perPerson: string }) {
  return (
    <div className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2">
      <span className="text-gray-300">{label}</span>
      <div className="text-right">
        <span className="font-medium">{value}</span>
        <span className="text-xs text-gray-500 ml-2">({perPerson})</span>
      </div>
    </div>
  );
}

"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from "recharts";
import type { FestivalPlan } from "@/types/festival";

interface EnergyChartProps {
  plan: FestivalPlan;
}

export function EnergyChart({ plan }: EnergyChartProps) {
  const data = plan.energy.hourly_mix.map((h) => ({
    hour: h.hour.slice(0, 5),
    "Grid (renewable)": h.grid_renewable,
    "Grid (fossil)": h.grid_fossil,
    Hydrogen: h.hydrogen,
    Battery: h.battery,
    price: h.price,
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">24h Energy Dispatch</h3>
      <div className="bg-gray-800/50 rounded-lg p-3">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="hour" tick={{ fill: "#9CA3AF", fontSize: 10 }} interval={2} />
            <YAxis yAxisId="left" tick={{ fill: "#9CA3AF", fontSize: 10 }} label={{ value: "kWh", angle: -90, position: "insideLeft", style: { fill: "#6B7280", fontSize: 10 } }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#9CA3AF", fontSize: 10 }} label={{ value: "€/MWh", angle: 90, position: "insideRight", style: { fill: "#6B7280", fontSize: 10 } }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#9CA3AF" }}
            />
            <Area yAxisId="left" type="monotone" dataKey="Grid (renewable)" stackId="1" stroke="#22C55E" fill="#22C55E" fillOpacity={0.8} />
            <Area yAxisId="left" type="monotone" dataKey="Grid (fossil)" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.8} />
            <Area yAxisId="left" type="monotone" dataKey="Hydrogen" stackId="1" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.8} />
            <Area yAxisId="left" type="monotone" dataKey="Battery" stackId="1" stroke="#A855F7" fill="#A855F7" fillOpacity={0.8} />
            <Line yAxisId="right" type="monotone" dataKey="price" name="Grid price (€/MWh)" stroke="#FCD34D" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap justify-center gap-3 text-xs mt-2">
          {[
            { name: "Grid (renewable)", color: "#22C55E" },
            { name: "Grid (fossil)", color: "#EF4444" },
            { name: "Hydrogen", color: "#06B6D4" },
            { name: "Battery", color: "#A855F7" },
            { name: "Grid price", color: "#FCD34D" },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              <span className="text-gray-400">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  Bar,
} from "recharts";
import type { FestivalPlan } from "@/types/festival";

interface EnergyChartProps {
  plan: FestivalPlan;
}

export function EnergyChart({ plan }: EnergyChartProps) {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

  const data = hours.map((hour) => ({
    hour: hour.slice(0, 5),
    solar: plan.energy.hourly_solar_kWh[hour] || 0,
    price: plan.energy.hourly_prices_eur_mwh[hour] || 0,
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Hourly Solar Output vs. Grid Price</h3>
      <div className="bg-gray-800/50 rounded-lg p-3">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="hour" tick={{ fill: "#9CA3AF", fontSize: 10 }} interval={3} />
            <YAxis yAxisId="left" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#9CA3AF" }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="solar"
              name="Solar (kWh)"
              stroke="#EAB308"
              fill="#EAB308"
              fillOpacity={0.3}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="price"
              name="Grid Price (€/MWh)"
              stroke="#22C55E"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-500 mt-2">
          Solar peaks when grid prices drop (or go negative). Batteries store surplus for evening peak pricing.
        </p>
      </div>
    </div>
  );
}

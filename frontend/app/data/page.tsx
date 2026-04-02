"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
} from "recharts";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Section({ title, children }: { title: string; children: any }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-200 mb-3">{title}</h2>
      <div className="bg-gray-800/50 rounded-lg p-4">{children}</div>
    </div>
  );
}

const COLORS = ["#22C55E", "#06B6D4", "#A855F7", "#EAB308", "#EF4444", "#F97316", "#EC4899"];

export default function DataPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/dataset`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center"><p className="animate-pulse">Loading dataset...</p></div>;
  }

  // --- Prepare chart data ---
  const solarMonthly = data.solar_irradiance_amsterdam?.monthly?.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m: any) => ({ name: m.name, irradiation: m.irradiation_kWh_m2_day, pv_output: m.pv_output_kWh_day })
  ) || [];

  const windMonthly = Object.entries(data.wind_data_amsterdam?.monthly_avg_m_per_s || {}).map(
    ([name, speed]) => ({ name, speed: speed as number })
  );

  const summerPrices = Object.entries(data.electricity_prices_netherlands?.typical_summer_day_hourly_EUR_MWh?.hours || {}).map(
    ([hour, price]) => ({ hour: hour.slice(0, 5), price: price as number })
  );

  const winterPrices = Object.entries(data.electricity_prices_netherlands?.typical_winter_day_hourly_EUR_MWh?.hours || {}).map(
    ([hour, price]) => ({ hour: hour.slice(0, 5), price: price as number })
  );

  const combinedPrices = summerPrices.map((s, i) => ({
    hour: s.hour,
    summer: s.price,
    winter: winterPrices[i]?.price || 0,
  }));

  const materialFlow = [
    { name: "Infrastructure", kg: 139292 },
    { name: "Tents", kg: 110000 },
    { name: "Backstage & Bars", kg: 94516 },
    { name: "Decoration", kg: 73920 },
    { name: "Stages", kg: 55559 },
    { name: "Electronics", kg: 44820 },
    { name: "Food Stands", kg: 12414 },
    { name: "Visitors Items", kg: 841 },
  ];

  const wasteDestination = [
    { name: "Reused", kg: 139292 + 110000 + 55559 + 44820 },
    { name: "Reused (human waste)", kg: 113400 },
    { name: "Consumed (meals)", kg: 9875 },
    { name: "Recycled", kg: 9240 + 4140 },
    { name: "Incinerated", kg: 3200 },
    { name: "Food waste", kg: 2539 },
  ];

  const perCapita = [
    { name: "Water", value: 13, unit: "L/day" },
    { name: "Food", value: 1.5, unit: "kg/day" },
    { name: "Drinks", value: 2.25, unit: "kg/day" },
    { name: "Waste", value: 0.08, unit: "kg/day" },
    { name: "Human waste", value: 2.84, unit: "kg/day" },
  ];

  const energyBenchmarks = [
    { name: "Diesel festival", kwh: 2.3 },
    { name: "Avg optimized", kwh: 0.5 },
    { name: "Mysteryland 2014", kwh: 0.15 },
    { name: "Mysteryland 2015", kwh: 0.08 },
  ];

  const gridRenewable = Array.from({ length: 12 }, (_, i) => {
    const shares: Record<number, number> = { 0: 30, 1: 32, 2: 36, 3: 40, 4: 45, 5: 50, 6: 48, 7: 45, 8: 38, 9: 34, 10: 30, 11: 28 };
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return { name: names[i], renewable: shares[i], fossil: 100 - shares[i] };
  });

  const liander = data.liander_consumption_amsterdam_noord?.sample_postcodes_near_ndsm?.map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any) => ({ postcode: p.postcode.replace("1033", ""), avg_kWh: p.avg_kWh })
  ) || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="px-6 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Dataset Explorer</h1>
          <p className="text-xs text-gray-400">Real data from Dutch/European energy sources powering the optimizer</p>
        </div>
        <Link href="/" className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">Back to Planner</Link>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Solar + Wind side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Solar Irradiance — Amsterdam (PVGIS)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={solarMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }} />
                <Bar dataKey="irradiation" name="Irradiation (kWh/m²/day)" fill="#EAB308" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pv_output" name="PV Output (kWh/kWp/day)" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">Annual: {data.solar_irradiance_amsterdam?.annual_irradiation_kWh_per_m2} kWh/m²/year</p>
          </Section>

          <Section title="Wind Speed — Amsterdam (monthly avg)">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={windMonthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} unit=" m/s" />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }} />
                <Area type="monotone" dataKey="speed" name="Wind (m/s)" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">Annual avg: {data.wind_data_amsterdam?.annual_average_m_per_s} m/s</p>
          </Section>
        </div>

        {/* Electricity prices */}
        <Section title="Electricity Spot Prices — Netherlands (EPEX, summer vs winter)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={combinedPrices}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" tick={{ fill: "#9CA3AF", fontSize: 10 }} interval={2} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} unit=" €" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }} />
              <Line type="monotone" dataKey="summer" name="Summer (€/MWh)" stroke="#EAB308" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="winter" name="Winter (€/MWh)" stroke="#06B6D4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2">Summer midday: negative prices (solar oversupply). {data.electricity_prices_netherlands?.negative_price_hours_share_percent}% of hours had negative prices in 2025.</p>
        </Section>

        {/* Grid renewable by month */}
        <Section title="Dutch Grid Renewable Share by Month">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gridRenewable}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }} />
              <Bar dataKey="renewable" name="Renewable %" stackId="a" fill="#22C55E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fossil" name="Fossil %" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2">This is why month matters — a June festival has 50% grid renewable vs 28% in December.</p>
        </Section>

        {/* DGTL Material Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="DGTL Material Flow — Input (2017, Metabolic)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={materialFlow} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "#9CA3AF", fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }} // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${Number(v).toLocaleString()} kg`]} />
                <Bar dataKey="kg" name="kg" fill="#06B6D4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">Total: ~531,000 kg. Infrastructure + tents = 47% of mass.</p>
          </Section>

          <Section title="DGTL Output Destination">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={wasteDestination} cx="50%" cy="50%" outerRadius={100} dataKey="kg" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {wasteDestination.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }} // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [`${Number(v).toLocaleString()} kg`]} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">Only 3,200 kg incinerated — less than 1% of total mass.</p>
          </Section>
        </div>

        {/* Energy benchmarks + per capita */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Energy per Visitor per Day — Benchmarks">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={energyBenchmarks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} unit=" kWh" />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }} />
                <Bar dataKey="kwh" name="kWh/person/day" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">Diesel-era baseline: 0.7L/person/day ≈ 2.3 kWh. Optimized: 10x less.</p>
          </Section>

          <Section title="Per Capita Resource Consumption (DGTL)">
            <div className="space-y-3 mt-2">
              {perCapita.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-sm text-gray-300 w-28">{item.name}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${Math.min(100, (item.value / 13) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-24 text-right">{item.value} {item.unit}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Liander local data */}
        {liander.length > 0 && (
          <Section title="Local Energy Consumption — NDSM Area (Liander, postcode 1033)">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={liander}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="postcode" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} unit=" kWh" />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }} />
                <Bar dataKey="avg_kWh" name="Avg kWh/year/connection" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">
              {data.liander_consumption_amsterdam_noord?.summary?.total_connections?.toLocaleString()} connections,{" "}
              avg {data.liander_consumption_amsterdam_noord?.summary?.weighted_avg_kWh_per_connection?.toLocaleString()} kWh/year.
              NL household avg: {data.liander_consumption_amsterdam_noord?.netherlands_household_avg_kWh?.toLocaleString()} kWh.
            </p>
          </Section>
        )}

        {/* Sources */}
        <div className="text-xs text-gray-600 space-y-1 pb-8">
          <p>Sources: PVGIS (EU JRC), EPEX SPOT NL, Liander Open Data, Waternet, KNMI, Metabolic/DGTL, Powerful Thinking, Julie&apos;s Bicycle</p>
        </div>
      </div>
    </div>
  );
}

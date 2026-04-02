"use client";

import { useState } from "react";
import type { FestivalPlan, Overrides } from "@/types/festival";

interface TweakPanelProps {
  plan: FestivalPlan;
  onTweak: (overrides: Overrides) => void;
}

function SliderRow({
  label, value, defaultValue, min, max, step, unit, onChange,
}: {
  label: string; value: number | null; defaultValue: number;
  min: number; max: number; step: number; unit: string;
  onChange: (v: number | null) => void;
}) {
  const current = value ?? defaultValue;
  const isOverridden = value !== null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isOverridden ? "text-cyan-400" : "text-gray-400"}`}>
            {current} {unit}
          </span>
          {isOverridden && (
            <button onClick={() => onChange(null)} className="text-xs text-gray-500 hover:text-gray-300">reset</button>
          )}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  );
}

export function TweakPanel({ plan, onTweak }: TweakPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [overrides, setOverrides] = useState<Overrides>({
    hydrogen_generators: null,
    battery_units: null,
    solar_panels: null,
    m2_per_person: null,
  });

  const update = (key: keyof Overrides, value: number | null) => {
    const next = { ...overrides, [key]: value };
    setOverrides(next);
    onTweak(next);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 transition-colors"
      >
        Override infrastructure...
      </button>
    );
  }

  return (
    <div className="bg-gray-800/70 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300">Infrastructure Overrides</h3>
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-500 hover:text-gray-300">collapse</button>
      </div>
      <SliderRow label="H₂ Generators" value={overrides.hydrogen_generators} defaultValue={plan.energy.hydrogen_generators} min={0} max={20} step={1} unit="units" onChange={(v) => update("hydrogen_generators", v)} />
      <SliderRow label="Solar Panels (400W)" value={overrides.solar_panels} defaultValue={plan.energy.solar_panels} min={0} max={5000} step={50} unit="panels" onChange={(v) => update("solar_panels", v)} />
      <SliderRow label="Batteries" value={overrides.battery_units} defaultValue={plan.energy.battery_units} min={0} max={300} step={5} unit="units" onChange={(v) => update("battery_units", v)} />
      <SliderRow label="Space per person" value={overrides.m2_per_person} defaultValue={1.0} min={0.5} max={5} step={0.1} unit="m²" onChange={(v) => update("m2_per_person", v)} />
    </div>
  );
}

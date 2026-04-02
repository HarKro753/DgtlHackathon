import type { FestivalPlan } from "@/types/festival";
import type { PolygonPoint } from "@/components/Map";
import { fmt } from "./format";

export function buildExportText(plan: FestivalPlan, polygon: PolygonPoint[]): string {
  const polygonStr = polygon.length > 0
    ? [``, `## Polygon`, ...polygon.map((p, i) => `  ${i + 1}. [${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}]`)].join("\n")
    : "";

  return [
    `# Festival Plan — ${plan.location_name}`,
    `${fmt(plan.area_m2)} m² · ${plan.duration_days} days · Month ${plan.month}`,
    ``, `Visitors: ${fmt(plan.max_visitors)} per day (${fmt(plan.max_visitors * plan.duration_days)} total)`, `Renewable: ${plan.energy.renewable_percent}%`,
    ``, `## Energy (${fmt(plan.energy.total_supply_kWh)} kWh total)`,
    ...plan.energy.sources.map((s) => `- ${s.name}: ${fmt(s.capacity_kWh)} kWh (${s.share_percent}%)`),
    `H₂ generators: ${plan.energy.hydrogen_generators} · Batteries: ${plan.energy.battery_units} · Grid: ${plan.energy.grid_kw} kW`,
    ``, `## Resources`,
    `Water: ${fmt(plan.resources.water_liters_total)} L · Food: ${fmt(plan.resources.food_kg_total)} kg · Drinks: ${fmt(plan.resources.drinks_kg_total)} kg`,
    `Waste: ${fmt(plan.resources.waste_kg_total)} kg · Toilets: ${plan.resources.toilets_required} · Human waste: ${fmt(plan.resources.human_waste_kg)} kg`,
    ``, `## Cost: €${fmt(plan.cost.total_eur)}`,
    `H₂: €${fmt(plan.cost.hydrogen_generators_eur)} · Batteries: €${fmt(plan.cost.batteries_eur)} · Grid: €${fmt(plan.cost.grid_connection_eur)}`,
    polygonStr,
  ].join("\n");
}

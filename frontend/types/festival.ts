export interface EnergySource {
  name: string;
  capacity_kWh: number;
  share_percent: number;
}

export interface HourlyMix {
  hour: string;
  demand: number;
  grid_renewable: number;
  grid_fossil: number;
  hydrogen: number;
  battery: number;
  price: number;
}

export interface Nudge {
  message: string;
  action: string;
  value: number;
  impact: string;
}

export interface EnergyBreakdown {
  total_supply_kWh: number;
  total_demand_kWh: number;
  sources: EnergySource[];
  hydrogen_generators: number;
  hydrogen_capacity_kWh: number;
  battery_units: number;
  battery_capacity_kWh: number;
  grid_kw: number;
  renewable_percent: number;
  hourly_mix: HourlyMix[];
}

export interface ResourceBreakdown {
  water_liters_total: number;
  water_liters_per_person: number;
  food_kg_total: number;
  food_kg_per_person: number;
  drinks_kg_total: number;
  drinks_kg_per_person: number;
  waste_kg_total: number;
  waste_kg_per_person: number;
  toilets_required: number;
  human_waste_kg: number;
}

export interface CostEstimate {
  hydrogen_generators_eur: number;
  batteries_eur: number;
  grid_connection_eur: number;
  total_eur: number;
}

export interface FestivalPlan {
  max_visitors: number;
  location_name: string;
  area_m2: number;
  duration_days: number;
  month: number;
  energy: EnergyBreakdown;
  resources: ResourceBreakdown;
  cost: CostEstimate;
  grid_congested: boolean;
  nudges: Nudge[];
}

export interface PlanRequest {
  lat: number;
  lng: number;
  area_m2: number;
  duration_days: number;
  month: number;
  mode: "visitors" | "renewable";
  target_visitors?: number | null;
  target_renewable_percent?: number | null;
  hydrogen_generators?: number | null;
  battery_units?: number | null;
  grid_kw?: number | null;
  m2_per_person?: number | null;
}

export interface Overrides {
  hydrogen_generators: number | null;
  battery_units: number | null;
  grid_kw: number | null;
  m2_per_person: number | null;
}

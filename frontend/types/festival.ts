export interface EnergySource {
  name: string;
  capacity_kWh: number;
  share_percent: number;
}

export interface EnergyBreakdown {
  total_supply_kWh: number;
  total_demand_kWh: number;
  sources: EnergySource[];
  solar_panels_count: number;
  solar_area_m2: number;
  battery_units: number;
  battery_capacity_kWh: number;
  hourly_solar_kWh: Record<string, number>;
  hourly_prices_eur_mwh: Record<string, number>;
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
  solar_panels_eur: number;
  batteries_eur: number;
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
  renewable_percent: number;
}

export interface PlanRequest {
  lat: number;
  lng: number;
  area_m2: number;
  duration_days: number;
  month: number;
}

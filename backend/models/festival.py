from pydantic import BaseModel, Field


class EnergySource(BaseModel):
    name: str
    capacity_kWh: float
    share_percent: float


class Nudge(BaseModel):
    message: str
    action: str
    value: int | float
    impact: str


class EnergyBreakdown(BaseModel):
    total_supply_kWh: float
    total_demand_kWh: float
    sources: list[EnergySource]
    hydrogen_generators: int
    hydrogen_capacity_kWh: float
    solar_panels: int
    solar_daily_kWh: float
    battery_units: int
    battery_capacity_kWh: float
    grid_kw: int
    renewable_percent: float
    hourly_mix: list[dict] = Field(default_factory=list)


class ResourceBreakdown(BaseModel):
    water_liters_total: float
    water_liters_per_person: float
    food_kg_total: float
    food_kg_per_person: float
    drinks_kg_total: float
    drinks_kg_per_person: float
    waste_kg_total: float
    waste_kg_per_person: float
    toilets_required: int
    human_waste_kg: float


class CostEstimate(BaseModel):
    hydrogen_generators_eur: float
    solar_panels_eur: float
    batteries_eur: float
    grid_connection_eur: float
    total_eur: float


class FestivalPlan(BaseModel):
    max_visitors: int
    location_name: str
    area_m2: float
    duration_days: int
    month: int
    energy: EnergyBreakdown
    resources: ResourceBreakdown
    cost: CostEstimate
    grid_congested: bool
    nudges: list[Nudge] = Field(default_factory=list)

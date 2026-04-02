from pydantic import BaseModel, Field


class EnergySource(BaseModel):
    name: str
    capacity_kWh: float
    share_percent: float


class EnergyBreakdown(BaseModel):
    total_supply_kWh: float
    total_demand_kWh: float
    sources: list[EnergySource]
    solar_panels_count: int
    solar_area_m2: float
    battery_units: int
    battery_capacity_kWh: float
    hourly_solar_kWh: dict[str, float] = Field(default_factory=dict, description="Hour → kWh solar output")
    hourly_prices_eur_mwh: dict[str, float] = Field(default_factory=dict, description="Hour → EUR/MWh spot price")


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
    solar_panels_eur: float
    batteries_eur: float
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
    grid_congested: bool = Field(description="Whether the local grid is at capacity")
    renewable_percent: float = Field(description="Percentage of energy from renewables")

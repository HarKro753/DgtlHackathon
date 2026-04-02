from pydantic import BaseModel, Field

from models.festival import FestivalPlan


class PlanRequest(BaseModel):
    lat: float
    lng: float
    area_m2: float
    duration_days: int = Field(default=2, ge=1, le=14)
    month: int = Field(default=4, ge=1, le=12)
    mode: str = Field(default="visitors")
    target_visitors: int | None = Field(default=None, ge=0)
    target_renewable_percent: float | None = Field(default=None, ge=0, le=100)
    # Infrastructure overrides
    hydrogen_generators: int | None = Field(default=None, ge=0, le=20)
    battery_units: int | None = Field(default=None, ge=0, le=500)
    solar_panels: int | None = Field(default=None, ge=0, le=10000, description="Number of 400W solar panels. Default 0.")
    m2_per_person: float | None = Field(default=None, ge=0.5, le=10)


class PlanResponse(BaseModel):
    plan: FestivalPlan

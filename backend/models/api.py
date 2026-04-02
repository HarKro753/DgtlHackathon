from pydantic import BaseModel, Field

from models.festival import FestivalPlan


class PlanRequest(BaseModel):
    lat: float
    lng: float
    area_m2: float
    duration_days: int = Field(default=2, ge=1, le=14)
    month: int = Field(default=4, ge=1, le=12)
    # Optimization mode
    mode: str = Field(default="visitors", description="'visitors' = maximize visitors given renewable target; 'renewable' = maximize renewable% given visitor target")
    # Constraints (depends on mode)
    target_visitors: int | None = Field(default=None, ge=0, description="Target visitor count (used in 'renewable' mode)")
    target_renewable_percent: float | None = Field(default=None, ge=0, le=100, description="Target renewable % (used in 'visitors' mode)")
    # Infrastructure overrides
    hydrogen_generators: int | None = Field(default=None, ge=0, le=20)
    battery_units: int | None = Field(default=None, ge=0, le=500)
    grid_kw: int | None = Field(default=None, ge=0, le=5000)
    m2_per_person: float | None = Field(default=None, ge=0.5, le=10)


class PlanResponse(BaseModel):
    plan: FestivalPlan

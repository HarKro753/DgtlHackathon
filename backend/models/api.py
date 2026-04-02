from pydantic import BaseModel, Field

from models.festival import FestivalPlan


class PlanRequest(BaseModel):
    lat: float = Field(description="Latitude of the center point")
    lng: float = Field(description="Longitude of the center point")
    area_m2: float = Field(description="Total usable area in square meters")
    duration_days: int = Field(default=2, ge=1, le=14)
    month: int = Field(default=4, ge=1, le=12)


class PlanResponse(BaseModel):
    plan: FestivalPlan

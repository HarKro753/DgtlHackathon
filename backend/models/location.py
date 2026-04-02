from pydantic import BaseModel, Field


class LocationInput(BaseModel):
    lat: float = Field(description="Latitude of the center point")
    lng: float = Field(description="Longitude of the center point")
    area_m2: float = Field(description="Total usable area in square meters")
    duration_days: int = Field(default=2, ge=1, le=14, description="Event duration in days")
    month: int = Field(default=4, ge=1, le=12, description="Month of the event (1-12)")

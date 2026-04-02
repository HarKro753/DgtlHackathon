from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import FRONTEND_URL
from models.api import PlanRequest, PlanResponse
from models.festival import FestivalPlan
from services.optimizer import compute_festival_plan
from services.dataset import load_dataset

app = FastAPI(title="DGTL Sustainable Event Planner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/plan")
async def plan(request: PlanRequest) -> PlanResponse:
    dataset = load_dataset()
    result: FestivalPlan = compute_festival_plan(
        lat=request.lat,
        lng=request.lng,
        area_m2=request.area_m2,
        duration_days=request.duration_days,
        month=request.month,
        dataset=dataset,
        mode=request.mode,
        target_visitors=request.target_visitors,
        target_renewable_percent=request.target_renewable_percent,
        hydrogen_generators_override=request.hydrogen_generators,
        battery_units_override=request.battery_units,
        grid_kw_override=request.grid_kw,
        m2_per_person_override=request.m2_per_person,
    )
    return PlanResponse(plan=result)


@app.get("/api/dataset")
async def get_dataset() -> dict:
    return load_dataset()


@app.get("/api/load-profile")
async def load_profile() -> dict:
    import json
    from pathlib import Path
    path = Path(__file__).parent / "data" / "amsterdam_load_profile.json"
    with open(path) as f:
        return json.load(f)

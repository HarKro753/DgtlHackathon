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
    )
    return PlanResponse(plan=result)


@app.get("/api/dataset")
async def get_dataset() -> dict:
    return load_dataset()

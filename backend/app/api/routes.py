from fastapi import APIRouter

from app.models.schemas import SimulateRequest, SimulateResponse, RecommendRequest, RecommendResponse
from app.simulation import narrative
from app.simulation.data import DISTRICTS, MEASURES, TOTAL_BUDGET
from app.simulation.scoring import base_scenario_score, compute_score
from app.simulation.validator import ValidationError
from app.simulation.recommendations import recommend

router = APIRouter()


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/districts")
def get_districts():
    return DISTRICTS


@router.get("/measures")
def get_measures():
    return {"measures": MEASURES, "total_budget": TOTAL_BUDGET}


@router.get("/base-score")
def get_base_score():
    return base_scenario_score()


@router.post("/simulate", response_model=SimulateResponse)
def simulate(req: SimulateRequest):
    selections = [s.model_dump() for s in req.selections]

    try:
        result = compute_score(selections)
    except ValidationError as e:
        return SimulateResponse(valid=False, error=str(e))

    base = base_scenario_score()
    explanation = narrative.generate_explanation(result, selections, base["score"])

    return SimulateResponse(
        valid=True,
        base_score=base["score"],
        explanation=explanation,
        **result,
    )


@router.post("/recommend", response_model=RecommendResponse)
def get_recommendations(req: RecommendRequest):
    return RecommendResponse(recommendations=recommend(
        [s.model_dump() for s in req.selections], req.result
    ))

from pydantic import BaseModel


class MeasureSelection(BaseModel):
    measure_id: str
    district: str | None = None


class SimulateRequest(BaseModel):
    selections: list[MeasureSelection]


class SimulateResponse(BaseModel):
    valid: bool
    error: str | None = None
    score: float | None = None
    d_avg: float | None = None
    weakest_district: str | None = None
    weakest_district_score: float | None = None
    district_scores: dict[str, float] | None = None
    district_indicators: dict[str, dict[str, float]] | None = None
    n_crit: int | None = None
    synergies_applied: list[dict] | None = None
    total_cost: int | None = None
    budget_left: int | None = None
    base_score: float | None = None
    explanation: str | None = None


class RecommendRequest(BaseModel):
    selections: list[MeasureSelection]
    result: dict


class Recommendation(BaseModel):
    selections: list[MeasureSelection]
    score: float
    rationale: str | None = None


class RecommendResponse(BaseModel):
    recommendations: list[Recommendation]

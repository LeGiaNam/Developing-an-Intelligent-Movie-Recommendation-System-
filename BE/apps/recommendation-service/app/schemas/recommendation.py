from pydantic import BaseModel


class RecommendationItem(BaseModel):
    movie_id: str
    score: float


class RecommendationResponse(BaseModel):
    items: list[RecommendationItem]


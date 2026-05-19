from pydantic import BaseModel
from pydantic import Field
from typing import Optional


class RecommendationItem(BaseModel):
    movie_id: str
    score: float
    title: str | None = None
    genres: str | None = None


class RecommendationResponse(BaseModel):
    items: list[RecommendationItem]


class RecommendRequest(BaseModel):
    userId: int = Field(..., description="MovieLens user id")
    gender: Optional[str] = Field(default="M")
    occupation: Optional[str] = Field(default="other")
    tag: Optional[str] = Field(default="")
    topK: Optional[int] = Field(default=10, ge=1, le=100)
    alpha: Optional[float] = Field(default=0.7, ge=0.0, le=1.0)


class GenreRecommendRequest(BaseModel):
    genres: list[str]
    topK: Optional[int] = Field(default=10, ge=1, le=100)


class MovieRecommendation(BaseModel):
    movieId: int
    title: str
    genres: str
    svd_score: float
    content_score: float
    hybrid_score: float


class RecommendResponse(BaseModel):
    userId: int
    recommendations: list[MovieRecommendation]


class PopularResponse(BaseModel):
    recommendations: list[MovieRecommendation]


class GenreRecommendResponse(BaseModel):
    genres: list[str]
    recommendations: list[MovieRecommendation]


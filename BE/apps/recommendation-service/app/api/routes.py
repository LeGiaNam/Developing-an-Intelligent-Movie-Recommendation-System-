from fastapi import APIRouter

from app.schemas.recommendation import RecommendationResponse
from app.services.recommendation_service import (
    get_personalized_movies,
    get_similar_movies,
    get_trending_movies,
    invalidate_profile_recommendations,
    invalidate_trending_recommendations,
)

router = APIRouter()


@router.get("/recommendations/similar/{movie_id}", response_model=RecommendationResponse)
def similar_movies(movie_id: str) -> RecommendationResponse:
    return RecommendationResponse(items=get_similar_movies(movie_id))


@router.get("/recommendations/personalized/{profile_id}", response_model=RecommendationResponse)
def personalized_movies(profile_id: str) -> RecommendationResponse:
    return RecommendationResponse(items=get_personalized_movies(profile_id))


@router.get("/recommendations/trending", response_model=RecommendationResponse)
def trending_movies() -> RecommendationResponse:
    return RecommendationResponse(items=get_trending_movies())


@router.post("/cache/invalidate/profile/{profile_id}")
def invalidate_profile_cache(profile_id: str) -> dict[str, bool]:
    invalidate_profile_recommendations(profile_id)
    return {"invalidated": True}


@router.post("/cache/invalidate/trending")
def invalidate_trending_cache() -> dict[str, bool]:
    invalidate_trending_recommendations()
    return {"invalidated": True}

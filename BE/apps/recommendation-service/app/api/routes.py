from fastapi import APIRouter
from fastapi import Query

from app.schemas.recommendation import (
    GenreRecommendRequest,
    GenreRecommendResponse,
    PopularResponse,
    RecommendRequest,
    RecommendResponse,
    RecommendationResponse,
)
from app.services.recommendation_service import (
    get_model_genre_recommendations,
    get_model_popular,
    get_model_recommendations,
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


@router.get("/popular", response_model=PopularResponse)
def popular(topK: int = Query(default=10, ge=1, le=100)) -> PopularResponse:
    return PopularResponse(recommendations=get_model_popular(top_k=topK))


@router.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest) -> RecommendResponse:
    recommendations = get_model_recommendations(
        user_id=request.userId,
        user_profile={
            "gender": request.gender or "M",
            "occupation": request.occupation or "other",
            "tag": request.tag or "",
        },
        top_k=request.topK or 10,
        alpha=request.alpha if request.alpha is not None else 0.7,
    )
    return RecommendResponse(userId=request.userId, recommendations=recommendations)


@router.post("/recommend/genres", response_model=GenreRecommendResponse)
def recommend_by_genres(request: GenreRecommendRequest) -> GenreRecommendResponse:
    recommendations = get_model_genre_recommendations(
        genres=request.genres,
        top_k=request.topK or 10,
    )
    return GenreRecommendResponse(genres=request.genres, recommendations=recommendations)


@router.post("/cache/invalidate/profile/{profile_id}")
def invalidate_profile_cache(profile_id: str) -> dict[str, bool]:
    invalidate_profile_recommendations(profile_id)
    return {"invalidated": True}


@router.post("/cache/invalidate/trending")
def invalidate_trending_cache() -> dict[str, bool]:
    invalidate_trending_recommendations()
    return {"invalidated": True}

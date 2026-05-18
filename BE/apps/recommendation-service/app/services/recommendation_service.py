from app.schemas.recommendation import RecommendationItem
from app.services.cache_service import (
    delete_cache_key,
    delete_cache_pattern,
    get_cached_recommendations,
    set_cached_recommendations,
)


def get_similar_movies(movie_id: str) -> list[RecommendationItem]:
    cache_key = f"recommendations:similar:{movie_id}"
    cached_items = get_cached_recommendations(cache_key)
    if cached_items is not None:
        return cached_items

    # Placeholder để thay bằng code RS hiện có của bạn.
    items = [
        RecommendationItem(movie_id=f"{movie_id}-similar-1", score=0.97),
        RecommendationItem(movie_id=f"{movie_id}-similar-2", score=0.94),
        RecommendationItem(movie_id=f"{movie_id}-similar-3", score=0.91),
    ]
    set_cached_recommendations(cache_key, items)
    return items


def get_personalized_movies(profile_id: str) -> list[RecommendationItem]:
    cache_key = f"recommendations:personalized:{profile_id}"
    cached_items = get_cached_recommendations(cache_key)
    if cached_items is not None:
        return cached_items

    items = [
        RecommendationItem(movie_id=f"{profile_id}-for-you-1", score=0.99),
        RecommendationItem(movie_id=f"{profile_id}-for-you-2", score=0.95),
        RecommendationItem(movie_id=f"{profile_id}-for-you-3", score=0.92),
    ]
    set_cached_recommendations(cache_key, items)
    return items


def get_trending_movies() -> list[RecommendationItem]:
    cache_key = "recommendations:trending:global"
    cached_items = get_cached_recommendations(cache_key)
    if cached_items is not None:
        return cached_items

    items = [
        RecommendationItem(movie_id="trending-1", score=0.98),
        RecommendationItem(movie_id="trending-2", score=0.96),
        RecommendationItem(movie_id="trending-3", score=0.93),
    ]
    set_cached_recommendations(cache_key, items)
    return items


def invalidate_profile_recommendations(profile_id: str) -> None:
    delete_cache_key(f"recommendations:personalized:{profile_id}")


def invalidate_trending_recommendations() -> None:
    delete_cache_pattern("recommendations:trending:*")

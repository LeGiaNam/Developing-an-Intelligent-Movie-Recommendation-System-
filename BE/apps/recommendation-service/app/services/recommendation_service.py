from functools import lru_cache

from app.schemas.recommendation import MovieRecommendation, RecommendationItem
from app.services.cache_service import (
    delete_cache_key,
    delete_cache_pattern,
    get_cached_recommendations,
    set_cached_recommendations,
)
from app.services.mongo_recommendation_service import (
    get_precomputed_items,
    get_mongo_personalized,
    get_mongo_similar,
    get_mongo_trending,
    is_mongo_ready,
)
from app.services.metrics_service import increment


@lru_cache(maxsize=1)
def get_recommender():
    try:
        from app.ml.recommender import HybridMovieRecommender

        return HybridMovieRecommender()
    except (FileNotFoundError, ImportError):
        return None


def is_model_loaded() -> bool:
    return get_recommender() is not None


def is_mongo_loaded() -> bool:
    return is_mongo_ready()


def _to_item(item: dict) -> RecommendationItem:
    movie_id = str(item.get("movieObjectId") or item.get("movie_id") or item.get("movieId"))
    score = float(item.get("hybrid_score") or item.get("score") or 0)
    return RecommendationItem(
        movie_id=movie_id,
        score=score,
        title=item.get("title"),
        genres=item.get("genres"),
    )


def _to_movie(item: dict) -> MovieRecommendation:
    score = float(item.get("hybrid_score") or item.get("score") or 0)
    return MovieRecommendation(
        movieId=int(item.get("movieId") or item.get("movie_id")),
        title=str(item.get("title") or ""),
        genres=str(item.get("genres") or ""),
        svd_score=float(item.get("svd_score") or score),
        content_score=float(item.get("content_score") or score),
        hybrid_score=score,
    )


def get_model_popular(top_k: int = 10) -> list[MovieRecommendation]:
    recommender = get_recommender()
    if recommender is None:
        return [_to_movie({"movieId": i, "score": 0.9 - i / 100}) for i in range(1, top_k + 1)]
    return [_to_movie(item) for item in recommender.recommend_popular(top_k=top_k)]


def get_model_recommendations(
    user_id: int,
    user_profile: dict[str, str],
    top_k: int = 10,
    alpha: float = 0.7,
) -> list[MovieRecommendation]:
    recommender = get_recommender()
    if recommender is None:
        return get_model_popular(top_k=top_k)

    return [
        _to_movie(item)
        for item in recommender.recommend_for_user(
            user_id=user_id,
            user_profile=user_profile,
            top_k=top_k,
            alpha=alpha,
        )
    ]


def get_model_genre_recommendations(genres: list[str], top_k: int = 10) -> list[MovieRecommendation]:
    recommender = get_recommender()
    if recommender is None:
        return get_model_popular(top_k=top_k)
    return [_to_movie(item) for item in recommender.recommend_by_genres(genres=genres, top_k=top_k)]


def get_similar_movies(movie_id: str) -> list[RecommendationItem]:
    cache_key = f"recommendations:similar:{movie_id}"
    cached_items = get_cached_recommendations(cache_key)
    if cached_items is not None:
        return cached_items
    precomputed_items = get_precomputed_items(cache_key)
    if precomputed_items is not None:
        increment("recommendations.precomputed_hit")
        set_cached_recommendations(cache_key, precomputed_items)
        return precomputed_items

    recommender = get_recommender()
    numeric_movie_id = recommender.resolve_numeric_movie_id(movie_id) if recommender is not None else None
    if recommender is not None and numeric_movie_id is not None:
        movies_df = recommender._movies_df
        movie_row = movies_df[movies_df["movieId"] == numeric_movie_id]
        if movie_row.empty:
            items = [_to_item(item.model_dump()) for item in get_model_popular(top_k=10)]
        else:
            genres = str(movie_row.iloc[0].get("genres", "")).split("|")
            related = recommender.recommend_by_genres(genres=genres, top_k=11)
            items = [_to_item(item) for item in related if str(item.get("movieId")) != str(numeric_movie_id)][:10]
    else:
        try:
            items = get_mongo_similar(movie_id)
        except Exception:
            increment("recommendations.error")
            items = []

    set_cached_recommendations(cache_key, items)
    return items


def get_personalized_movies(profile_id: str) -> list[RecommendationItem]:
    cache_key = f"recommendations:personalized:{profile_id}"
    cached_items = get_cached_recommendations(cache_key)
    if cached_items is not None:
        return cached_items
    precomputed_items = get_precomputed_items(cache_key)
    if precomputed_items is not None:
        increment("recommendations.precomputed_hit")
        set_cached_recommendations(cache_key, precomputed_items)
        return precomputed_items

    if profile_id.isdigit():
        recommendations = get_model_recommendations(
            user_id=int(profile_id),
            user_profile={"gender": "M", "occupation": "other", "tag": ""},
            top_k=10,
        )
        items = [_to_item(item.model_dump()) for item in recommendations]
    elif get_recommender() is not None:
        items = [_to_item(item.model_dump()) for item in get_model_popular(top_k=10)]
    else:
        try:
            items = get_mongo_personalized(profile_id)
        except Exception:
            increment("recommendations.error")
            items = []

    set_cached_recommendations(cache_key, items)
    return items


def get_trending_movies() -> list[RecommendationItem]:
    cache_key = "recommendations:trending:global"
    cached_items = get_cached_recommendations(cache_key)
    if cached_items is not None:
        return cached_items
    precomputed_items = get_precomputed_items(cache_key)
    if precomputed_items is not None:
        increment("recommendations.precomputed_hit")
        set_cached_recommendations(cache_key, precomputed_items)
        return precomputed_items

    if get_recommender() is not None:
        items = [_to_item(item.model_dump()) for item in get_model_popular(top_k=10)]
    else:
        try:
            items = get_mongo_trending()
        except Exception:
            increment("recommendations.error")
            items = []

    set_cached_recommendations(cache_key, items)
    return items


def invalidate_profile_recommendations(profile_id: str) -> None:
    delete_cache_key(f"recommendations:personalized:{profile_id}")


def invalidate_trending_recommendations() -> None:
    delete_cache_pattern("recommendations:trending:*")

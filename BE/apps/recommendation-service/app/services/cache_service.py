import json

from redis import Redis
from redis.exceptions import RedisError

from app.core.config import REDIS_URL, RECOMMENDATION_CACHE_TTL_SECONDS
from app.schemas.recommendation import RecommendationItem
from app.services.metrics_service import increment


def _client() -> Redis:
    return Redis.from_url(REDIS_URL, decode_responses=True)


def get_cached_recommendations(cache_key: str) -> list[RecommendationItem] | None:
    try:
        payload = _client().get(cache_key)
    except RedisError:
        increment("cache.redis_error")
        return None

    if not payload:
        increment("cache.miss")
        return None

    increment("cache.hit")
    return [RecommendationItem(**item) for item in json.loads(payload)]


def set_cached_recommendations(cache_key: str, items: list[RecommendationItem]) -> None:
    try:
        payload = json.dumps([item.model_dump() for item in items])
        _client().setex(cache_key, RECOMMENDATION_CACHE_TTL_SECONDS, payload)
        increment("cache.set")
    except RedisError:
        increment("cache.redis_error")
        return


def delete_cache_key(cache_key: str) -> None:
    try:
        _client().delete(cache_key)
        increment("cache.invalidate")
    except RedisError:
        increment("cache.redis_error")
        return


def delete_cache_pattern(pattern: str) -> None:
    try:
        client = _client()
        keys = list(client.scan_iter(pattern))
        if keys:
            client.delete(*keys)
            increment("cache.invalidate", len(keys))
    except RedisError:
        increment("cache.redis_error")
        return

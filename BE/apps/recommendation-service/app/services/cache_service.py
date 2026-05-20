import json
from functools import lru_cache

from redis import Redis
from redis.exceptions import RedisError

from app.core.config import REDIS_URL, RECOMMENDATION_CACHE_TTL_SECONDS
from app.schemas.recommendation import RecommendationItem
from app.services.metrics_service import increment


@lru_cache(maxsize=1)
def _client() -> Redis:
    return Redis.from_url(REDIS_URL, decode_responses=True)


def is_redis_ready() -> bool:
    try:
        return bool(_client().ping())
    except RedisError:
        increment("cache.redis_error")
        return False


def cache_snapshot() -> dict:
    try:
        client = _client()
        info = client.info(section="stats")
        return {
            "redis_loaded": True,
            "ttl_seconds": RECOMMENDATION_CACHE_TTL_SECONDS,
            "recommendation_keys": sum(1 for _ in client.scan_iter("recommendations:*")),
            "keyspace_hits": int(info.get("keyspace_hits", 0)),
            "keyspace_misses": int(info.get("keyspace_misses", 0)),
        }
    except RedisError:
        increment("cache.redis_error")
        return {
            "redis_loaded": False,
            "ttl_seconds": RECOMMENDATION_CACHE_TTL_SECONDS,
            "recommendation_keys": 0,
            "keyspace_hits": 0,
            "keyspace_misses": 0,
        }


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


def delete_cache_key(cache_key: str) -> int:
    try:
        deleted = _client().delete(cache_key)
        if deleted:
            increment("cache.invalidate", deleted)
        return int(deleted)
    except RedisError:
        increment("cache.redis_error")
        return 0


def delete_cache_pattern(pattern: str) -> int:
    try:
        client = _client()
        keys = list(client.scan_iter(pattern))
        if keys:
            deleted = client.delete(*keys)
            increment("cache.invalidate", len(keys))
            return int(deleted)
        return 0
    except RedisError:
        increment("cache.redis_error")
        return 0

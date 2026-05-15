import os


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
RECOMMENDATION_CACHE_TTL_SECONDS = int(os.getenv("RECOMMENDATION_CACHE_TTL_SECONDS", "300"))


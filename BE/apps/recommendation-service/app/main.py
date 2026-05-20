from fastapi import FastAPI
from fastapi import Request
import logging
from time import perf_counter

from app.api.routes import router
from app.services.recommendation_service import is_model_loaded, is_mongo_loaded
from app.services.model_registry import model_readiness
from app.services.metrics_service import increment, observe_latency, snapshot
from app.services.cache_service import cache_snapshot, is_redis_ready

app = FastAPI(title="IPANMOVIE Recommendation Service", version="1.0.0")
app.include_router(router, prefix="/v1")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ipanmovie.rs")


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start = perf_counter()
    increment("http.requests")
    try:
        response = await call_next(request)
    except Exception:
        increment("http.errors")
        logger.exception("RS request failed", extra={"path": request.url.path})
        raise
    elapsed_ms = (perf_counter() - start) * 1000
    observe_latency(elapsed_ms)
    increment(f"http.status.{response.status_code}")
    logger.info("RS request", extra={"path": request.url.path, "status": response.status_code, "latency_ms": round(elapsed_ms, 2)})
    return response


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "model_loaded": is_model_loaded(),
        "mongo_loaded": is_mongo_loaded(),
        "redis_loaded": is_redis_ready(),
    }


@app.get("/health/ready")
def readiness() -> dict:
    readiness_state = model_readiness()
    return {
        "status": "ok" if is_mongo_loaded() and is_redis_ready() else "degraded",
        "mongo_loaded": is_mongo_loaded(),
        "redis": cache_snapshot(),
        "model_loaded": is_model_loaded(),
        "serving_mode": "hybrid_ml" if is_model_loaded() else "mongo_heuristic",
        "model": readiness_state,
    }


@app.get("/metrics")
def metrics() -> dict:
    return snapshot()


from fastapi import FastAPI

from app.api.routes import router
from app.services.recommendation_service import is_model_loaded, is_mongo_loaded

app = FastAPI(title="IPANMOVIE Recommendation Service", version="1.0.0")
app.include_router(router, prefix="/v1")


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "model_loaded": is_model_loaded(),
        "mongo_loaded": is_mongo_loaded(),
    }


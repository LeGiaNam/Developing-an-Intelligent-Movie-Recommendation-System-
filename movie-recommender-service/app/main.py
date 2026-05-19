"""
main.py - FastAPI Application
==============================
Khởi động server:
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

Swagger UI: http://127.0.0.1:8000/docs
"""

from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Query

from app.recommender import HybridMovieRecommender
from app.schemas import (
    GenreRecommendRequest,
    GenreRecommendResponse,
    MovieRecommendation,
    PopularResponse,
    RecommendRequest,
    RecommendResponse,
)

# Global instance - chỉ load model 1 lần khi server start
recommender: Optional[HybridMovieRecommender] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model khi startup, giải phóng khi shutdown."""
    global recommender
    print("[Server] Đang khởi động và load model AI...")
    try:
        recommender = HybridMovieRecommender()
        print("[Server] ✅ Model đã sẵn sàng phục vụ!")
    except FileNotFoundError as e:
        print(f"[Server] ⚠️  Chưa có model: {e}")
        print("[Server] API sẽ chạy nhưng các endpoint /recommend sẽ báo lỗi.")
        print("[Server] Vui lòng chạy: python training/train.py")
    yield
    print("[Server] Server tắt.")


app = FastAPI(
    title="Movie Recommendation API",
    description=(
        "API gợi ý phim dùng Hybrid Model (SVD + Random Forest).\n\n"
        "**Trước khi dùng:** Chạy `python training/train.py` để train model."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


def _check_model_loaded():
    """Kiểm tra model đã load chưa, raise HTTP 503 nếu chưa."""
    if recommender is None:
        raise HTTPException(
            status_code=503,
            detail="Model chưa được load. Vui lòng chạy training/train.py trước."
        )


# ------------------------------------------------------------------
# ENDPOINTS
# ------------------------------------------------------------------

@app.get("/", summary="Trang chủ")
def root():
    return {
        "service": "Movie Recommendation API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", summary="Kiểm tra trạng thái server")
def health():
    """Trả về trạng thái server và model."""
    model_ready = recommender is not None and recommender._is_loaded
    return {
        "status": "ok",
        "model_loaded": model_ready,
        "total_movies": len(recommender._movies_df) if model_ready else 0,
    }


@app.post("/recommend", response_model=RecommendResponse, summary="Gợi ý phim theo user")
def recommend(request: RecommendRequest):
    """
    Trả về danh sách phim đề xuất cho user cụ thể.

    - Nếu userId tồn tại → dùng Hybrid (SVD + RandomForest)
    - Nếu userId mới (cold-start) → fallback sang popular
    """
    _check_model_loaded()

    user_profile = {
        "gender": request.gender or "M",
        "occupation": request.occupation or "other",
        "tag": request.tag or "",
    }

    raw_results = recommender.recommend_for_user(
        user_id=request.userId,
        user_profile=user_profile,
        top_k=request.topK or 10,
        alpha=request.alpha if request.alpha is not None else 0.7,
    )

    recommendations = [MovieRecommendation(**item) for item in raw_results]
    return RecommendResponse(userId=request.userId, recommendations=recommendations)


@app.get("/popular", response_model=PopularResponse, summary="Phim phổ biến nhất")
def popular(topK: int = Query(default=10, ge=1, le=100, description="Số phim trả về")):
    """Trả về danh sách phim phổ biến nhất theo Bayesian rating."""
    _check_model_loaded()
    raw_results = recommender.recommend_popular(top_k=topK)
    return PopularResponse(recommendations=[MovieRecommendation(**item) for item in raw_results])


@app.post("/recommend/genres", response_model=GenreRecommendResponse, summary="Gợi ý theo thể loại")
def recommend_by_genres(request: GenreRecommendRequest):
    """
    Trả về danh sách phim theo thể loại.

    Ví dụ genres: ["Action", "Comedy", "Adventure"]
    """
    _check_model_loaded()
    raw_results = recommender.recommend_by_genres(
        genres=request.genres,
        top_k=request.topK or 10
    )
    return GenreRecommendResponse(
        genres=request.genres,
        recommendations=[MovieRecommendation(**item) for item in raw_results]
    )

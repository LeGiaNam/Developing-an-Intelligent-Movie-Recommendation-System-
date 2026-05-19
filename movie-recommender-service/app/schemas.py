from pydantic import BaseModel, Field
from typing import List, Optional


class RecommendRequest(BaseModel):
    """Request body cho endpoint POST /recommend"""
    userId: int = Field(..., description="ID người dùng trong hệ thống MovieLens")
    gender: Optional[str] = Field(default="M", description="Giới tính: M hoặc F")
    occupation: Optional[str] = Field(default="other", description="Nghề nghiệp")
    tag: Optional[str] = Field(default="", description="Tag phim yêu thích, cách nhau bằng dấu cách")
    topK: Optional[int] = Field(default=10, description="Số phim đề xuất trả về")
    alpha: Optional[float] = Field(default=0.7, description="Trọng số SVD trong hybrid score (0.0-1.0)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "userId": 1,
                "gender": "M",
                "occupation": "student",
                "tag": "action adventure",
                "topK": 10,
                "alpha": 0.7
            }
        }
    }


class GenreRecommendRequest(BaseModel):
    """Request body cho endpoint POST /recommend/genres"""
    genres: List[str] = Field(..., description="Danh sách thể loại phim, VD: ['Action', 'Comedy']")
    topK: Optional[int] = Field(default=10, description="Số phim đề xuất trả về")

    model_config = {
        "json_schema_extra": {
            "example": {
                "genres": ["Action", "Adventure"],
                "topK": 10
            }
        }
    }


class MovieRecommendation(BaseModel):
    """Một phim trong danh sách đề xuất"""
    movieId: int
    title: str
    genres: str
    svd_score: float = Field(description="Điểm dự đoán từ mô hình SVD (Collaborative Filtering)")
    content_score: float = Field(description="Điểm dự đoán từ Random Forest (Content-Based)")
    hybrid_score: float = Field(description="Điểm tổng hợp = alpha*svd + (1-alpha)*content")


class RecommendResponse(BaseModel):
    """Response trả về cho /recommend"""
    userId: int
    recommendations: List[MovieRecommendation]


class PopularResponse(BaseModel):
    """Response trả về cho /popular"""
    recommendations: List[MovieRecommendation]


class GenreRecommendResponse(BaseModel):
    """Response trả về cho /recommend/genres"""
    genres: List[str]
    recommendations: List[MovieRecommendation]

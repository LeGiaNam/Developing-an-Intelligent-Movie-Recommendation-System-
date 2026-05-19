from functools import lru_cache
from urllib.parse import urlparse

from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import PyMongoError

from app.core.config import MONGODB_DATABASE, MONGO_URI
from app.schemas.recommendation import RecommendationItem


DEFAULT_LIMIT = 12


def _database_name() -> str:
    if MONGODB_DATABASE:
        return MONGODB_DATABASE
    parsed = urlparse(MONGO_URI)
    return parsed.path.strip("/") or "ipanmovie"


@lru_cache(maxsize=1)
def _client() -> MongoClient:
    return MongoClient(MONGO_URI, serverSelectionTimeoutMS=1500)


def is_mongo_ready() -> bool:
    try:
        _client().admin.command("ping")
        return True
    except PyMongoError:
        return False


def _db():
    return _client()[_database_name()]


def _object_id(value: str):
    return ObjectId(value) if ObjectId.is_valid(value) else value


def _movie_item(movie: dict, score: float | None = None) -> RecommendationItem:
    rating = float(movie.get("averageRating") or 0)
    normalized_score = score if score is not None else min(max(rating / 5, 0), 1)
    return RecommendationItem(
        movie_id=str(movie.get("_id")),
        score=round(float(normalized_score), 4),
        title=movie.get("title"),
        genres="|".join(movie.get("genres") or []),
    )


def get_mongo_trending(top_k: int = DEFAULT_LIMIT) -> list[RecommendationItem]:
    movies = (
        _db().movies.find({"isDeleted": {"$ne": True}})
        .sort([("averageRating", -1), ("ratingCount", -1), ("createdAt", -1)])
        .limit(top_k)
    )
    return [_movie_item(movie) for movie in movies]


def get_mongo_similar(movie_id: str, top_k: int = DEFAULT_LIMIT) -> list[RecommendationItem]:
    movie = _db().movies.find_one({"_id": _object_id(movie_id), "isDeleted": {"$ne": True}})
    if not movie:
        return get_mongo_trending(top_k)

    genres = movie.get("genres") or []
    query = {"_id": {"$ne": movie["_id"]}, "isDeleted": {"$ne": True}}
    if genres:
        query["genres"] = {"$in": genres}

    movies = list(
        _db().movies.find(query)
        .sort([("averageRating", -1), ("ratingCount", -1), ("createdAt", -1)])
        .limit(top_k)
    )
    if not movies:
        return get_mongo_trending(top_k)
    return [_movie_item(item) for item in movies]


def get_mongo_personalized(profile_id: str, top_k: int = DEFAULT_LIMIT) -> list[RecommendationItem]:
    profile_ref = _object_id(profile_id)
    db = _db()

    ratings = list(db.ratings.find({"profileId": profile_ref}).sort([("score", -1), ("updatedAt", -1)]).limit(30))
    history = list(db.watchhistories.find({"profileId": profile_ref}).sort("lastWatchedAt", -1).limit(30))
    watchlist = list(db.watchlists.find({"profileId": profile_ref}).sort("createdAt", -1).limit(30))

    source_ids = [item.get("movieId") for item in [*ratings, *history, *watchlist] if item.get("movieId")]
    if not source_ids:
        return get_mongo_trending(top_k)

    source_movies = list(db.movies.find({"_id": {"$in": source_ids}, "isDeleted": {"$ne": True}}))
    genres = sorted({genre for movie in source_movies for genre in movie.get("genres", [])})
    if not genres:
        return get_mongo_trending(top_k)

    candidates = list(
        db.movies.find({
            "_id": {"$nin": source_ids},
            "isDeleted": {"$ne": True},
            "genres": {"$in": genres},
        })
        .sort([("averageRating", -1), ("ratingCount", -1), ("createdAt", -1)])
        .limit(top_k)
    )
    if not candidates:
        return get_mongo_trending(top_k)

    genre_weights = {genre: 1 for genre in genres}
    for movie in source_movies:
        for genre in movie.get("genres", []):
            genre_weights[genre] = genre_weights.get(genre, 0) + 1

    results = []
    for movie in candidates:
        genre_score = sum(genre_weights.get(genre, 0) for genre in movie.get("genres", []))
        rating_score = float(movie.get("averageRating") or 0) / 5
        score = min((genre_score / max(len(source_movies), 1)) * 0.55 + rating_score * 0.45, 1)
        results.append(_movie_item(movie, score=score))

    return sorted(results, key=lambda item: item.score, reverse=True)[:top_k]

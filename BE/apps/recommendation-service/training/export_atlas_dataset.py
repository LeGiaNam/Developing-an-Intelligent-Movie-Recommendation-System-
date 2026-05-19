#!/usr/bin/env python3
import argparse
import csv
import json
import os
from pathlib import Path
from urllib.parse import quote_plus, urlparse

from pymongo import MongoClient


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA_DIR = PROJECT_ROOT / "data"


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def build_mongo_uri() -> str:
    direct_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
    if direct_uri:
        return direct_uri

    cluster = os.getenv("MONGODB_CLUSTER")
    user = os.getenv("MONGODB_USER")
    password = os.getenv("MONGODB_PASSWORD")
    database = os.getenv("MONGODB_DATABASE")
    if cluster and user and password and database:
        app_name = os.getenv("MONGODB_APPNAME")
        query = f"?appName={quote_plus(app_name)}" if app_name else ""
        return f"mongodb+srv://{quote_plus(user)}:{quote_plus(password)}@{cluster}/{database}{query}"

    return "mongodb://localhost:27017/ipanmovie"


def database_name(uri: str) -> str:
    return os.getenv("MONGODB_DATABASE") or urlparse(uri).path.strip("/") or "ipanmovie"


def write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Export Atlas movie data to recommender CSV files.")
    parser.add_argument("--env-file", type=Path, default=PROJECT_ROOT.parent / "api" / ".env")
    parser.add_argument("--out", type=Path, default=DEFAULT_DATA_DIR)
    args = parser.parse_args()

    load_env_file(args.env_file)
    uri = build_mongo_uri()
    db = MongoClient(uri)[database_name(uri)]

    movies = list(db.movies.find({"isDeleted": {"$ne": True}}).sort("createdAt", 1))
    profiles = list(db.profiles.find({}).sort("createdAt", 1))
    ratings = list(db.ratings.find({}).sort("createdAt", 1))
    comments = list(db.comments.find({}).sort("createdAt", 1))

    movie_id_by_object_id = {str(movie["_id"]): index + 1 for index, movie in enumerate(movies)}
    profile_id_by_object_id = {str(profile["_id"]): index + 1 for index, profile in enumerate(profiles)}

    movie_rows = [
        {
            "movieId": movie_id_by_object_id[str(movie["_id"])],
            "mongoMovieId": str(movie["_id"]),
            "title": movie.get("title", ""),
            "genres": "|".join(movie.get("genres") or ["(no genres listed)"]),
        }
        for movie in movies
    ]
    user_rows = [
        {
            "userId": profile_id_by_object_id[str(profile["_id"])],
            "mongoProfileId": str(profile["_id"]),
            "gender": "unknown",
            "age": 0,
            "occupation": "kids" if profile.get("isKids") else "viewer",
        }
        for profile in profiles
    ]
    rating_rows = [
        {
            "userId": profile_id_by_object_id.get(str(rating.get("profileId"))),
            "movieId": movie_id_by_object_id.get(str(rating.get("movieId"))),
            "rating": rating.get("score", 0),
            "timestamp": int(rating.get("updatedAt", rating.get("createdAt")).timestamp())
            if rating.get("updatedAt") or rating.get("createdAt")
            else 0,
        }
        for rating in ratings
        if str(rating.get("profileId")) in profile_id_by_object_id and str(rating.get("movieId")) in movie_id_by_object_id
    ]
    tag_rows = [
        {
            "userId": profile_id_by_object_id.get(str(comment.get("profileId"))),
            "movieId": movie_id_by_object_id.get(str(comment.get("movieId"))),
            "tag": comment.get("content", ""),
            "timestamp": int(comment.get("updatedAt", comment.get("createdAt")).timestamp())
            if comment.get("updatedAt") or comment.get("createdAt")
            else 0,
        }
        for comment in comments
        if str(comment.get("profileId")) in profile_id_by_object_id and str(comment.get("movieId")) in movie_id_by_object_id
    ]

    write_csv(args.out / "movies.csv", ["movieId", "mongoMovieId", "title", "genres"], movie_rows)
    write_csv(args.out / "ratings.csv", ["userId", "movieId", "rating", "timestamp"], rating_rows)
    write_csv(args.out / "tags.csv", ["userId", "movieId", "tag", "timestamp"], tag_rows)
    write_csv(args.out / "users.csv", ["userId", "mongoProfileId", "gender", "age", "occupation"], user_rows)

    id_map = {
        "movies": {str(v): k for k, v in movie_id_by_object_id.items()},
        "profiles": {str(v): k for k, v in profile_id_by_object_id.items()},
    }
    (args.out / "id_map.json").write_text(json.dumps(id_map, indent=2), encoding="utf-8")

    print(json.dumps({
        "out": str(args.out),
        "movies": len(movie_rows),
        "profiles": len(user_rows),
        "ratings": len(rating_rows),
        "tags": len(tag_rows),
    }, indent=2))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import argparse
import csv
import json
import math
from collections import defaultdict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA_DIR = PROJECT_ROOT / "data"
DEFAULT_REPORT_DIR = PROJECT_ROOT / "reports"


def read_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def dcg(relevance: list[int]) -> float:
    return sum(rel / math.log2(index + 2) for index, rel in enumerate(relevance))


def average_precision(relevance: list[int]) -> float:
    hits = 0
    score = 0.0
    for index, rel in enumerate(relevance, start=1):
        if rel:
            hits += 1
            score += hits / index
    return score / hits if hits else 0.0


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate recommendation readiness from exported dataset.")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--out", type=Path, default=DEFAULT_REPORT_DIR / "offline_evaluation.json")
    parser.add_argument("--k", type=int, default=10)
    args = parser.parse_args()

    movies = read_csv(args.data / "movies.csv")
    ratings = read_csv(args.data / "ratings.csv")

    ratings_by_user: dict[str, list[dict]] = defaultdict(list)
    ratings_by_movie: dict[str, list[float]] = defaultdict(list)
    genres_by_movie = {}

    for movie in movies:
        genres_by_movie[movie["movieId"]] = set(filter(None, movie.get("genres", "").split("|")))

    for row in ratings:
        try:
            score = float(row["rating"])
        except (KeyError, ValueError):
            continue
        row = {**row, "rating": score}
        ratings_by_user[row["userId"]].append(row)
        ratings_by_movie[row["movieId"]].append(score)

    global_mean = (
        sum(score for scores in ratings_by_movie.values() for score in scores)
        / max(sum(len(scores) for scores in ratings_by_movie.values()), 1)
    )
    movie_mean = {
        movie_id: sum(scores) / len(scores)
        for movie_id, scores in ratings_by_movie.items()
        if scores
    }

    squared_errors = []
    absolute_errors = []
    precision_values = []
    recall_values = []
    map_values = []
    ndcg_values = []
    recommended_movie_ids = set()
    diversity_values = []
    novelty_values = []

    popular_ranked = sorted(
        movie_mean,
        key=lambda movie_id: (movie_mean[movie_id], len(ratings_by_movie[movie_id])),
        reverse=True,
    )
    total_rating_count = sum(len(scores) for scores in ratings_by_movie.values())

    for user_id, user_ratings in ratings_by_user.items():
        if len(user_ratings) < 2:
            continue

        liked = {row["movieId"] for row in user_ratings if row["rating"] >= 4}
        watched = {row["movieId"] for row in user_ratings}
        candidates = [movie_id for movie_id in popular_ranked if movie_id not in watched]
        if len(candidates) < args.k:
            candidates = [movie["movieId"] for movie in movies if movie["movieId"] not in watched]
        recommendations = candidates[: args.k]
        recommended_movie_ids.update(recommendations)

        relevance = [1 if movie_id in liked else 0 for movie_id in recommendations]
        hits = sum(relevance)
        precision_values.append(hits / args.k)
        recall_values.append(hits / len(liked) if liked else 0.0)
        map_values.append(average_precision(relevance))
        ideal = sorted(relevance, reverse=True)
        ndcg_values.append(dcg(relevance) / dcg(ideal) if dcg(ideal) else 0.0)

        genre_sets = [genres_by_movie.get(movie_id, set()) for movie_id in recommendations]
        pair_distances = []
        for i in range(len(genre_sets)):
            for j in range(i + 1, len(genre_sets)):
                union = genre_sets[i] | genre_sets[j]
                intersection = genre_sets[i] & genre_sets[j]
                pair_distances.append(1 - (len(intersection) / len(union) if union else 0))
        diversity_values.append(sum(pair_distances) / len(pair_distances) if pair_distances else 0.0)

        novelty_values.append(
            sum(-math.log2((len(ratings_by_movie.get(movie_id, [])) + 1) / (total_rating_count + len(movies)))
                for movie_id in recommendations)
            / max(len(recommendations), 1)
        )

    for scores in ratings_by_movie.values():
        for score in scores:
            prediction = global_mean
            squared_errors.append((score - prediction) ** 2)
            absolute_errors.append(abs(score - prediction))

    report = {
        "dataset": {
            "movies": len(movies),
            "users": len(ratings_by_user),
            "ratings": sum(len(scores) for scores in ratings_by_movie.values()),
        },
        "rating_prediction_baseline": {
            "rmse": round(math.sqrt(sum(squared_errors) / len(squared_errors)), 4) if squared_errors else None,
            "mae": round(sum(absolute_errors) / len(absolute_errors), 4) if absolute_errors else None,
        },
        "top_n_baseline": {
            "k": args.k,
            "precision_at_k": round(sum(precision_values) / len(precision_values), 4) if precision_values else None,
            "recall_at_k": round(sum(recall_values) / len(recall_values), 4) if recall_values else None,
            "map": round(sum(map_values) / len(map_values), 4) if map_values else None,
            "ndcg": round(sum(ndcg_values) / len(ndcg_values), 4) if ndcg_values else None,
            "coverage": round(len(recommended_movie_ids) / len(movies), 4) if movies else None,
            "diversity": round(sum(diversity_values) / len(diversity_values), 4) if diversity_values else None,
            "novelty": round(sum(novelty_values) / len(novelty_values), 4) if novelty_values else None,
        },
        "readiness": {
            "offline_metrics_available": bool(ratings),
            "minimum_sample_warning": len(ratings) < 100,
        },
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()

import mongoose from "mongoose";
import { Movie } from "../../modules/movies/movie.model.js";
import { Rating } from "../../modules/ratings/rating.model.js";
import { WatchHistory } from "../../modules/watch-history/watch-history.model.js";
import { Watchlist } from "../../modules/watchlist/watchlist.model.js";
import {
  getPersonalizedMovies,
  getSimilarMovies,
  getTrendingMovies,
} from "./recommendation.client.js";

const DEFAULT_LIMIT = 12;

function validObjectIds(items) {
  return items
    .map((item) => item.movie_id ?? item.movieId ?? item.id)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));
}

async function hydrateRecommendationItems(items, limit = DEFAULT_LIMIT) {
  const ids = validObjectIds(items);
  if (ids.length === 0) return [];

  const movies = await Movie.find({ _id: { $in: ids }, isDeleted: false });
  const byId = new Map(movies.map((movie) => [movie._id.toString(), movie]));
  return ids.map((id) => byId.get(id.toString())).filter(Boolean).slice(0, limit);
}

async function trendingFallback(limit = DEFAULT_LIMIT) {
  return Movie.find({ isDeleted: false })
    .sort({ averageRating: -1, ratingCount: -1, createdAt: -1 })
    .limit(limit);
}

async function similarFallback(movieId, limit = DEFAULT_LIMIT) {
  const movie = await Movie.findOne({ _id: movieId, isDeleted: false });
  if (!movie) return trendingFallback(limit);

  const genreMatch = movie.genres?.length ? { genres: { $in: movie.genres } } : {};
  const similar = await Movie.find({
    _id: { $ne: movie._id },
    isDeleted: false,
    ...genreMatch,
  })
    .sort({ averageRating: -1, ratingCount: -1 })
    .limit(limit);

  return similar.length ? similar : trendingFallback(limit);
}

async function personalizedFallback(profileId, limit = DEFAULT_LIMIT) {
  const [ratings, history, watchlist] = await Promise.all([
    Rating.find({ profileId }).populate("movieId"),
    WatchHistory.find({ profileId }).populate("movieId").sort({ lastWatchedAt: -1 }).limit(20),
    Watchlist.find({ profileId }).populate("movieId"),
  ]);

  const sourceMovies = [
    ...ratings.map((item) => item.movieId),
    ...history.map((item) => item.movieId),
    ...watchlist.map((item) => item.movieId),
  ].filter(Boolean);

  const excludedIds = sourceMovies.map((movie) => movie._id);
  const genres = [...new Set(sourceMovies.flatMap((movie) => movie.genres ?? []))];

  if (genres.length === 0) {
    return trendingFallback(limit);
  }

  const personalized = await Movie.find({
    _id: { $nin: excludedIds },
    isDeleted: false,
    genres: { $in: genres },
  })
    .sort({ averageRating: -1, ratingCount: -1 })
    .limit(limit);

  return personalized.length ? personalized : trendingFallback(limit);
}

export async function getHydratedTrendingRecommendations(limit = DEFAULT_LIMIT) {
  const serviceItems = await getTrendingMovies();
  const hydrated = await hydrateRecommendationItems(serviceItems, limit);
  return hydrated.length ? hydrated : trendingFallback(limit);
}

export async function getHydratedSimilarRecommendations(movieId, limit = DEFAULT_LIMIT) {
  const serviceItems = await getSimilarMovies(movieId);
  const hydrated = (await hydrateRecommendationItems(serviceItems, limit)).filter(
    (movie) => movie._id.toString() !== movieId
  );
  return hydrated.length ? hydrated : similarFallback(movieId, limit);
}

export async function getHydratedPersonalizedRecommendations(profileId, limit = DEFAULT_LIMIT) {
  const serviceItems = await getPersonalizedMovies(profileId);
  const hydrated = await hydrateRecommendationItems(serviceItems, limit);
  return hydrated.length ? hydrated : personalizedFallback(profileId, limit);
}

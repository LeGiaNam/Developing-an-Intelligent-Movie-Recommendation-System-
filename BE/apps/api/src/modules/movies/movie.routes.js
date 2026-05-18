import { ok } from "../../common/utils/response.js";
import { Movie } from "./movie.model.js";
import { Episode } from "./episode.model.js";
import { getSimilarMovies, getTrendingMovies } from "../../integrations/recommendation/recommendation.client.js";

export async function movieRoutes(app) {
  app.get("/discovery/trending", async () => ok(await getTrendingMovies()));

  app.get("/", async (request) => {
    const page = Math.max(Number(request.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(request.query.limit ?? 24), 1), 50);
    const movies = await Movie.find({ isDeleted: false })
      .skip((page - 1) * limit)
      .limit(limit);
    return ok(movies);
  });

  app.get("/:movieId", async (request) => {
    const movie = await Movie.findOne({ _id: request.params.movieId, isDeleted: false });
    return ok(movie);
  });

  app.get("/:movieId/episodes", async (request) => {
    const episodes = await Episode.find({ movieId: request.params.movieId }).sort({ seasonNumber: 1, episodeNumber: 1 });
    return ok(episodes);
  });

  app.get("/:movieId/similar", async (request) => {
    const similar = await getSimilarMovies(request.params.movieId);
    return ok(similar);
  });
}

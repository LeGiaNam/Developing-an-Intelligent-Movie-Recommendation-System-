import { z } from "zod";
import { authenticate } from "../../common/middleware/auth.js";
import { ok } from "../../common/utils/response.js";
import { Rating } from "./rating.model.js";
import { Movie } from "../movies/movie.model.js";
import { assertProfileOwnership } from "../../common/utils/assertProfileOwnership.js";
import {
  invalidateProfileRecommendations,
  invalidateSimilarRecommendations,
  invalidateTrendingRecommendations,
} from "../../integrations/recommendation/recommendation.client.js";

export async function ratingRoutes(app) {
  app.addHook("preHandler", authenticate);

  app.get("/:profileId/ratings", async (request) => {
    await assertProfileOwnership(request.params.profileId, request.user.sub);
    const ratings = await Rating.find({ profileId: request.params.profileId })
      .populate("movieId")
      .sort({ updatedAt: -1 })
      .limit(20);
    return ok(ratings);
  });

  app.put("/:profileId/ratings/:movieId", async (request) => {
    await assertProfileOwnership(request.params.profileId, request.user.sub);
    const { score } = z.object({ score: z.number().int().min(1).max(5) }).parse(request.body);
    const rating = await Rating.findOneAndUpdate(
      { profileId: request.params.profileId, movieId: request.params.movieId },
      { score },
      { upsert: true, new: true }
    );
    const [stats] = await Rating.aggregate([
      { $match: { movieId: rating.movieId } },
      { $group: { _id: "$movieId", averageRating: { $avg: "$score" }, ratingCount: { $sum: 1 } } },
    ]);
    await Movie.findByIdAndUpdate(request.params.movieId, {
      averageRating: Number(stats.averageRating.toFixed(2)),
      ratingCount: stats.ratingCount,
    });
    await Promise.all([
      invalidateProfileRecommendations(request.params.profileId),
      invalidateSimilarRecommendations(request.params.movieId),
      invalidateTrendingRecommendations(),
    ]);
    return ok(rating);
  });
}

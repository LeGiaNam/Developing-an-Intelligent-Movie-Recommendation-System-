import { z } from "zod";
import { authenticate } from "../../common/middleware/auth.js";
import { ok } from "../../common/utils/response.js";
import { assertProfileOwnership } from "../../common/utils/assertProfileOwnership.js";
import { WatchHistory } from "./watch-history.model.js";
import {
  invalidateProfileRecommendations,
  invalidateTrendingRecommendations,
} from "../../integrations/recommendation/recommendation.client.js";

export async function watchHistoryRoutes(app) {
  app.addHook("preHandler", authenticate);

  app.get("/:profileId/history", async (request) => {
    await assertProfileOwnership(request.params.profileId, request.user.sub);
    const items = await WatchHistory.find({ profileId: request.params.profileId })
      .populate("movieId")
      .sort({ lastWatchedAt: -1 })
      .limit(20);
    return ok(items);
  });

  app.put("/:profileId/history/:movieId", async (request) => {
    await assertProfileOwnership(request.params.profileId, request.user.sub);
    const input = z.object({
      episodeId: z.string().nullable().optional(),
      progressSeconds: z.number().int().min(0),
      durationSeconds: z.number().int().min(0),
    }).parse(request.body);

    const completed = input.durationSeconds > 0 && input.progressSeconds >= input.durationSeconds * 0.9;
    const item = await WatchHistory.findOneAndUpdate(
      {
        profileId: request.params.profileId,
        movieId: request.params.movieId,
        episodeId: input.episodeId ?? null,
      },
      {
        ...input,
        completed,
        lastWatchedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    const invalidations = [invalidateProfileRecommendations(request.params.profileId)];
    if (completed) {
      invalidations.push(invalidateTrendingRecommendations());
    }
    await Promise.all(invalidations);
    return ok(item);
  });
}

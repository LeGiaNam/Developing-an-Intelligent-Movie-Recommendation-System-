import { authenticate } from "../../common/middleware/auth.js";
import { ok } from "../../common/utils/response.js";
import { Watchlist } from "./watchlist.model.js";
import { assertProfileOwnership } from "../../common/utils/assertProfileOwnership.js";

export async function watchlistRoutes(app) {
  app.addHook("preHandler", authenticate);

  app.get("/:profileId/watchlist", async (request) => {
    await assertProfileOwnership(request.params.profileId, request.user.sub);
    const items = await Watchlist.find({ profileId: request.params.profileId }).populate("movieId");
    return ok(items);
  });

  app.post("/:profileId/watchlist/:movieId", async (request, reply) => {
    await assertProfileOwnership(request.params.profileId, request.user.sub);
    const item = await Watchlist.findOneAndUpdate(
      { profileId: request.params.profileId, movieId: request.params.movieId },
      {},
      { upsert: true, new: true }
    );
    reply.code(201);
    return ok(item);
  });

  app.delete("/:profileId/watchlist/:movieId", async (request) => {
    await assertProfileOwnership(request.params.profileId, request.user.sub);
    await Watchlist.deleteOne({ profileId: request.params.profileId, movieId: request.params.movieId });
    return ok({ deleted: true });
  });
}

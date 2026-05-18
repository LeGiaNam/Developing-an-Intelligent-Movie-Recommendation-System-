import { z } from "zod";
import { authenticate, requireAdmin } from "../../common/middleware/auth.js";
import { ok } from "../../common/utils/response.js";
import { Movie } from "../movies/movie.model.js";
import { Episode } from "../movies/episode.model.js";
import { User } from "../auth/user.model.js";
import { normalizeText } from "../../common/utils/normalizeText.js";

export async function adminRoutes(app) {
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireAdmin);

  app.post("/movies", async (request, reply) => {
    const input = z.object({
      title: z.string(),
      slug: z.string(),
      description: z.string().optional(),
      type: z.enum(["movie", "series"]).optional(),
      genres: z.array(z.string()).default([]),
      countries: z.array(z.string()).default([]),
      releaseYear: z.number().int().optional(),
    }).parse(request.body);

    const movie = await Movie.create({ ...input, normalizedTitle: normalizeText(input.title) });
    reply.code(201);
    return ok(movie);
  });

  app.patch("/movies/:movieId", async (request) => {
    const movie = await Movie.findByIdAndUpdate(request.params.movieId, request.body, { new: true });
    return ok(movie);
  });

  app.delete("/movies/:movieId", async (request) => {
    await Movie.findByIdAndUpdate(request.params.movieId, { isDeleted: true });
    return ok({ deleted: true });
  });

  app.post("/movies/:movieId/episodes", async (request, reply) => {
    const episode = await Episode.create({ movieId: request.params.movieId, ...request.body });
    reply.code(201);
    return ok(episode);
  });

  app.get("/users", async () => ok(await User.find()));

  app.patch("/users/:userId/status", async (request) => {
    const { status } = z.object({ status: z.enum(["active", "suspended"]) }).parse(request.body);
    return ok(await User.findByIdAndUpdate(request.params.userId, { status }, { new: true }));
  });
}

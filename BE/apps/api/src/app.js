import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { AppError } from "./common/errors/AppError.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { profileRoutes } from "./modules/profiles/profile.routes.js";
import { movieRoutes } from "./modules/movies/movie.routes.js";
import { searchRoutes } from "./modules/search/search.routes.js";
import { watchlistRoutes } from "./modules/watchlist/watchlist.routes.js";
import { ratingRoutes } from "./modules/ratings/rating.routes.js";
import { commentRoutes } from "./modules/comments/comment.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { watchHistoryRoutes } from "./modules/watch-history/watch-history.routes.js";
import { recommendationEventRoutes } from "./modules/recommendation-events/recommendation-event.routes.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(helmet);
  await app.register(rateLimit, {
    max: env.rateLimitMax,
    timeWindow: env.rateLimitWindow,
  });
  await app.register(jwt, { secret: env.jwtSecret });

  app.get("/health", async () => ({ status: "ok" }));
  app.setErrorHandler((error, _request, reply) => {
    if (error.name === "ZodError" || Array.isArray(error.issues)) {
      reply.code(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid request data", details: error.issues } });
      return;
    }

    if (error instanceof AppError) {
      reply.code(error.statusCode).send({ success: false, error: { code: error.code, message: error.message, details: error.details } });
      return;
    }

    if (error.message === "FORBIDDEN") {
      reply.code(403).send({ success: false, error: { code: "FORBIDDEN", message: "You do not have permission to perform this action" } });
      return;
    }

    reply.code(500).send({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" } });
  });

  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(profileRoutes, { prefix: "/api/v1/profiles" });
  await app.register(movieRoutes, { prefix: "/api/v1/movies" });
  await app.register(searchRoutes, { prefix: "/api/v1/search" });
  await app.register(watchlistRoutes, { prefix: "/api/v1/profiles" });
  await app.register(ratingRoutes, { prefix: "/api/v1/profiles" });
  await app.register(watchHistoryRoutes, { prefix: "/api/v1/profiles" });
  await app.register(commentRoutes, { prefix: "/api/v1" });
  await app.register(adminRoutes, { prefix: "/api/v1/admin" });
  await app.register(recommendationEventRoutes, { prefix: "/api/v1/recommendation-events" });

  return app;
}

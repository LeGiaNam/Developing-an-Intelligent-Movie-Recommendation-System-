import { z } from "zod";
import bcrypt from "bcryptjs";
import { authenticate, requireAdmin } from "../../common/middleware/auth.js";
import { ok } from "../../common/utils/response.js";
import { Movie } from "../movies/movie.model.js";
import { Episode } from "../movies/episode.model.js";
import { User } from "../auth/user.model.js";
import { Profile } from "../profiles/profile.model.js";
import { AppError } from "../../common/errors/AppError.js";
import { normalizeText } from "../../common/utils/normalizeText.js";

const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);

function publicUser(user) {
  return {
    _id: user._id?.toString(),
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

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
      posterUrl: z.string().url().optional(),
      backdropUrl: z.string().url().optional(),
      trailerUrl: z.string().url().optional(),
      videoSources: z.array(z.object({ quality: z.string(), url: z.string().url() })).optional(),
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

  app.get("/users", async () => {
    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return ok(users.map(publicUser));
  });

  app.post("/users", async (request, reply) => {
    const input = z.object({
      email: z.string().email(),
      password: passwordSchema,
      role: z.enum(["user", "admin"]).default("user"),
      status: z.enum(["active", "suspended"]).default("active"),
      profileName: z.string().min(1).max(40).optional(),
    }).parse(request.body);

    const normalizedEmail = input.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError(409, "EMAIL_EXISTS", "Email da duoc dang ky");
    }

    const user = await User.create({
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      status: input.status,
    });
    await Profile.create({ userId: user._id, name: input.profileName ?? "Main Profile" });

    reply.code(201);
    return ok(publicUser(user));
  });

  app.patch("/users/:userId/status", async (request) => {
    const { status } = z.object({ status: z.enum(["active", "suspended"]) }).parse(request.body);
    const user = await User.findByIdAndUpdate(request.params.userId, { status }, { new: true }).select("-passwordHash");
    return ok(user);
  });
}

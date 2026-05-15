import { z } from "zod";
import bcrypt from "bcryptjs";
import { authenticate } from "../../common/middleware/auth.js";
import { AppError } from "../../common/errors/AppError.js";
import { ok } from "../../common/utils/response.js";
import { Profile } from "./profile.model.js";
import { getPersonalizedMovies } from "../../integrations/recommendation/recommendation.client.js";

export async function profileRoutes(app) {
  app.addHook("preHandler", authenticate);

  app.get("/", async (request) => {
    const profiles = await Profile.find({ userId: request.user.sub });
    return ok(profiles);
  });

  app.post("/", async (request, reply) => {
    const input = z.object({ name: z.string().min(1), avatarUrl: z.string().url().optional(), isKids: z.boolean().optional() }).parse(request.body);
    const count = await Profile.countDocuments({ userId: request.user.sub });
    if (count >= 5) {
      throw new AppError(409, "PROFILE_LIMIT_REACHED", "Mỗi tài khoản chỉ được tối đa 5 profile");
    }

    const profile = await Profile.create({ ...input, userId: request.user.sub });
    reply.code(201);
    return ok(profile);
  });

  app.patch("/:profileId", async (request) => {
    const input = z.object({
      name: z.string().min(1).optional(),
      avatarUrl: z.string().url().optional(),
      isKids: z.boolean().optional(),
      pin: z.string().min(4).max(8).optional(),
    }).parse(request.body);

    const update = { ...input };
    if (input.pin) {
      update.pinHash = await bcrypt.hash(input.pin, 10);
      delete update.pin;
    }

    const profile = await Profile.findOneAndUpdate(
      { _id: request.params.profileId, userId: request.user.sub },
      update,
      { new: true }
    );
    return ok(profile);
  });

  app.delete("/:profileId", async (request) => {
    const count = await Profile.countDocuments({ userId: request.user.sub });
    if (count <= 1) {
      throw new AppError(409, "LAST_PROFILE", "Tài khoản phải có ít nhất 1 profile");
    }
    await Profile.deleteOne({ _id: request.params.profileId, userId: request.user.sub });
    return ok({ deleted: true });
  });

  app.post("/:profileId/verify-pin", async (request) => {
    const { pin } = z.object({ pin: z.string() }).parse(request.body);
    const profile = await Profile.findOne({ _id: request.params.profileId, userId: request.user.sub });
    const isValid = !profile?.pinHash || (await bcrypt.compare(pin, profile.pinHash));
    return ok({ valid: isValid });
  });

  app.get("/:profileId/recommendations", async (request) => {
    const profile = await Profile.findOne({ _id: request.params.profileId, userId: request.user.sub });
    if (!profile) {
      throw new AppError(404, "PROFILE_NOT_FOUND", "Không tìm thấy profile");
    }
    return ok(await getPersonalizedMovies(request.params.profileId));
  });
}

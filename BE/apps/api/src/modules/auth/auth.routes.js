import bcrypt from "bcryptjs";
import { z } from "zod";
import { ok } from "../../common/utils/response.js";
import { AppError } from "../../common/errors/AppError.js";
import { User } from "./user.model.js";
import { Profile } from "../profiles/profile.model.js";
import { authenticate } from "../../common/middleware/auth.js";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  profileName: z.string().min(1).max(40).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(user) {
  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function signAuthPayload(app, user) {
  const token = await app.jwt.sign({ sub: user._id.toString(), role: user.role });
  const profiles = await Profile.find({ userId: user._id });
  return {
    accessToken: token,
    user: publicUser(user),
    profiles,
  };
}

export async function authRoutes(app) {
  app.post("/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const normalizedEmail = input.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError(409, "EMAIL_EXISTS", "Email da duoc dang ky");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      status: "active",
    });
    await Profile.create({ userId: user._id, name: input.profileName ?? "Main Profile" });

    reply.code(201);
    return ok(await signAuthPayload(app, user));
  });

  app.post("/login", async (request) => {
    const input = loginSchema.parse(request.body);
    const user = await User.findOne({ email: input.email.toLowerCase().trim() });
    if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Sai email hoac mat khau");
    }
    if (user.status === "suspended") {
      throw new AppError(403, "ACCOUNT_SUSPENDED", "Tai khoan da bi khoa");
    }

    return ok(await signAuthPayload(app, user));
  });

  app.get("/me", { preHandler: authenticate }, async (request) => {
    const user = await User.findById(request.user.sub).select("-passwordHash");
    const profiles = await Profile.find({ userId: request.user.sub });
    return ok({ user, profiles });
  });
}

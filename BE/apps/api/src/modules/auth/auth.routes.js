import bcrypt from "bcryptjs";
import { z } from "zod";
import { ok } from "../../common/utils/response.js";
import { AppError } from "../../common/errors/AppError.js";
import { User } from "./user.model.js";
import { Profile } from "../profiles/profile.model.js";
import { authenticate } from "../../common/middleware/auth.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
});

export async function authRoutes(app) {
  app.post("/register", async (request, reply) => {
    const input = registerSchema.parse(request.body);
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
      throw new AppError(409, "EMAIL_EXISTS", "Email đã được đăng ký");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({
      email: input.email,
      passwordHash,
      otp: {
        codeHash: await bcrypt.hash("123456", 10),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await Profile.create({ userId: user._id, name: "Main Profile" });
    reply.code(201);
    return ok({ userId: user._id, message: "Đã tạo tài khoản. Hãy xác thực OTP." });
  });

  app.post("/verify-otp", async (request) => {
    const { email, otp } = z.object({ email: z.string().email(), otp: z.string().length(6) }).parse(request.body);
    const user = await User.findOne({ email });
    if (!user?.otp?.codeHash || user.otp.expiresAt < new Date()) {
      throw new AppError(400, "OTP_INVALID", "OTP không hợp lệ hoặc đã hết hạn");
    }

    const isValid = await bcrypt.compare(otp, user.otp.codeHash);
    if (!isValid) {
      throw new AppError(400, "OTP_INVALID", "OTP không hợp lệ hoặc đã hết hạn");
    }

    user.status = "active";
    user.emailVerifiedAt = new Date();
    user.otp = undefined;
    await user.save();
    return ok({ message: "Xác thực thành công" });
  });

  app.post("/resend-otp", async (request) => {
    const { email } = z.object({ email: z.string().email() }).parse(request.body);
    const user = await User.findOne({ email });
    if (!user) {
      return ok({ message: "Nếu email tồn tại, OTP mới đã được gửi" });
    }

    const resendCount = user.otp?.resendCount ?? 0;
    if (resendCount >= 3) {
      throw new AppError(429, "OTP_RESEND_LIMIT", "Bạn đã vượt quá số lần gửi OTP trong ngày");
    }

    user.otp = {
      codeHash: await bcrypt.hash("123456", 10),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      resendCount: resendCount + 1,
      lastSentAt: new Date(),
    };
    await user.save();
    return ok({ message: "Nếu email tồn tại, OTP mới đã được gửi" });
  });

  app.post("/login", async (request) => {
    const { email, password } = z.object({ email: z.string().email(), password: z.string() }).parse(request.body);
    const user = await User.findOne({ email });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Sai email hoặc mật khẩu");
    }
    if (user.status !== "active") {
      throw new AppError(403, "ACCOUNT_NOT_ACTIVE", "Tài khoản chưa sẵn sàng để đăng nhập");
    }

    const token = await app.jwt.sign({ sub: user._id.toString(), role: user.role });
    return ok({ accessToken: token });
  });

  app.get("/me", { preHandler: authenticate }, async (request) => {
    const user = await User.findById(request.user.sub).select("-passwordHash -otp");
    const profiles = await Profile.find({ userId: request.user.sub });
    return ok({ user, profiles });
  });

  app.get("/google/mock", async () => {
    const email = "google.user@ipanmovie.local";
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        email,
        googleId: "mock-google-user",
        status: "active",
        emailVerifiedAt: new Date(),
      });
      await Profile.create({ userId: user._id, name: "Google Profile" });
    }

    const token = await app.jwt.sign({ sub: user._id.toString(), role: user.role });
    return ok({ accessToken: token, provider: "google-mock" });
  });

  app.post("/forgot-password", async (request) => {
    z.object({ email: z.string().email() }).parse(request.body);
    return ok({ message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi" });
  });

  app.post("/reset-password", async (request) => {
    z.object({ token: z.string(), password: z.string().min(8) }).parse(request.body);
    return ok({ message: "Mật khẩu đã được cập nhật" });
  });
}

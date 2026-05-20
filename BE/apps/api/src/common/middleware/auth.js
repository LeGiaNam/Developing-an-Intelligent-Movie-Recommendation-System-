import { AppError } from "../errors/AppError.js";

export async function authenticate(request) {
  try {
    await request.jwtVerify();
  } catch {
    throw new AppError(401, "UNAUTHORIZED", "Authentication required");
  }
}

export async function requireAdmin(request) {
  if (request.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
}


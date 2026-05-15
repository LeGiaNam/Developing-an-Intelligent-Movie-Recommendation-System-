export async function authenticate(request) {
  await request.jwtVerify();
}

export function requireAdmin(request) {
  if (request.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
}


export async function authenticate(request) {
  await request.jwtVerify();
}

export async function requireAdmin(request) {
  if (request.user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
}


import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE_NAME = "ms_session";
const SESSION_TTL_DAYS = 14;

function hmacSha256(input: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET_MISSING");
  }
  return crypto.createHmac("sha256", secret).update(input).digest("hex");
}

export type AuthUser = {
  id: string;
  email: string;
  role: "VIBE_CODER" | "MENTOR";
  displayName: string;
  avatarPath: string | null;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hmacSha256(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    displayName: session.user.displayName,
    avatarPath: session.user.avatarPath ?? null,
  };
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hmacSha256(token),
      expiresAt,
    },
  });

  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSession() {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hmacSha256(token) } });
  }
  c.delete(COOKIE_NAME);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireMentor() {
  const user = await requireUser();
  if (user.role !== "MENTOR") throw new Error("FORBIDDEN");
  return user;
}

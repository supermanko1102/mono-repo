import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/app/lib/db";
import { jsonError, jsonOk } from "@/app/lib/http";
import { createSession } from "@/app/lib/session";

const Body = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  role: z.enum(["VIBE_CODER", "MENTOR"]),
  displayName: z.string().min(1).max(60),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid input", 400);

  const { email, password, role, displayName } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return jsonError("Email already registered", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      displayName,
    },
  });

  await createSession(user.id);
  return jsonOk({
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    avatarPath: user.avatarPath ?? null,
  });
}

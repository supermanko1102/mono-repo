import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/app/lib/db";
import { jsonError, jsonOk } from "@/app/lib/http";
import { createSession } from "@/app/lib/session";

const Body = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid input", 400);

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return jsonError("Invalid credentials", 401);

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return jsonError("Invalid credentials", 401);

  await createSession(user.id);
  return jsonOk({
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    avatarPath: user.avatarPath ?? null,
  });
}

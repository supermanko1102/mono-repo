import { prisma } from "@/app/lib/db";
import { jsonOk } from "@/app/lib/http";

export async function GET() {
  const mentors = await prisma.user.findMany({
    where: { role: "MENTOR" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      displayName: true,
      bio: true,
      avatarPath: true,
    },
  });
  return jsonOk(mentors.map((m) => ({ ...m, avatarPath: m.avatarPath ?? null })));
}

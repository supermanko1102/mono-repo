import { prisma } from "@/app/lib/db";
import { jsonError, jsonOk } from "@/app/lib/http";

type Ctx = { params: Promise<{ mentorId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { mentorId } = await ctx.params;
  const mentor = await prisma.user.findUnique({
    where: { id: mentorId, role: "MENTOR" },
    select: { id: true, displayName: true, bio: true, avatarPath: true },
  });
  if (!mentor) return jsonError("Mentor not found", 404);

  const now = new Date();
  const slots = await prisma.availabilitySlot.findMany({
    where: {
      mentorId,
      status: "AVAILABLE",
      startAt: { gt: now },
    },
    orderBy: { startAt: "asc" },
    select: { id: true, mentorId: true, startAt: true, endAt: true, status: true, note: true },
  });

  return jsonOk({
    mentor: { ...mentor, avatarPath: mentor.avatarPath ?? null },
    slots: slots.map((s) => ({
      id: s.id,
      mentorId: s.mentorId,
      startAtIso: s.startAt.toISOString(),
      endAtIso: s.endAt.toISOString(),
      status: s.status,
      note: s.note,
    })),
  });
}

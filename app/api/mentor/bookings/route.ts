import { prisma } from "@/app/lib/db";
import { jsonError, jsonOk } from "@/app/lib/http";
import { requireMentor } from "@/app/lib/session";

export async function GET() {
  const me = await requireMentor().catch(() => null);
  if (!me) return jsonError("Unauthorized", 401);

  const bookings = await prisma.booking.findMany({
    where: { mentorId: me.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { displayName: true, email: true } },
      upload: { select: { path: true } },
      slot: { select: { startAt: true, endAt: true } },
    },
  });

  return jsonOk(
    bookings.map((b) => ({
      id: b.id,
      status: b.status,
      slotId: b.slotId,
      userId: b.userId,
      mentorId: b.mentorId,
      note: b.note,
      uploadPath: b.upload?.path ?? null,
      createdAtIso: b.createdAt.toISOString(),
      userDisplayName: b.user.displayName,
      userEmail: b.user.email,
      slotStartAtIso: b.slot.startAt.toISOString(),
      slotEndAtIso: b.slot.endAt.toISOString(),
    }))
  );
}

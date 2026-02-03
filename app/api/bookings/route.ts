import { z } from "zod";
import { prisma } from "@/app/lib/db";
import { jsonError, jsonOk } from "@/app/lib/http";
import { requireUser } from "@/app/lib/session";

const Body = z.object({
  slotId: z.string().min(1).max(80),
  note: z.string().max(500).default(""),
  uploadId: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  const me = await requireUser().catch(() => null);
  if (!me) return jsonError("Unauthorized", 401);
  if (me.role !== "VIBE_CODER") return jsonError("Forbidden", 403);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid input", 400);

  const { slotId, note, uploadId } = parsed.data;

  const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot) return jsonError("Slot not found", 404);
  if (slot.status !== "AVAILABLE") return jsonError("Slot not available", 409);

  if (uploadId) {
    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload || upload.ownerId !== me.id) return jsonError("Invalid upload", 400);
  }

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const updated = await tx.availabilitySlot.updateMany({
        where: { id: slotId, status: "AVAILABLE" },
        data: { status: "BOOKED" },
      });
      if (updated.count !== 1) throw new Error("SLOT_TAKEN");

      return tx.booking.create({
        data: {
          slotId,
          mentorId: slot.mentorId,
          userId: me.id,
          note,
          uploadId: uploadId ?? null,
        },
        include: { upload: { select: { path: true } }, slot: true },
      });
    });

    return jsonOk({
      id: booking.id,
      status: booking.status,
      slotId: booking.slotId,
      userId: booking.userId,
      mentorId: booking.mentorId,
      note: booking.note,
      uploadPath: booking.upload?.path ?? null,
      createdAtIso: booking.createdAt.toISOString(),
      slotStartAtIso: booking.slot.startAt.toISOString(),
      slotEndAtIso: booking.slot.endAt.toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "BOOKING_FAILED";
    if (msg === "SLOT_TAKEN") return jsonError("Slot not available", 409);
    return jsonError("Booking failed", 500);
  }
}

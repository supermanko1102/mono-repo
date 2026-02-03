import { z } from "zod";
import { prisma } from "@/app/lib/db";
import { jsonError, jsonOk } from "@/app/lib/http";
import { requireMentor } from "@/app/lib/session";

const CreateBody = z.object({
  date: z.string().min(1).max(20),
  time: z.string().min(1).max(20),
  durationMins: z.number().int().min(15).max(8 * 60),
  note: z.string().max(80).default(""),
});

export async function GET() {
  const me = await requireMentor().catch(() => null);
  if (!me) return jsonError("Unauthorized", 401);

  const slots = await prisma.availabilitySlot.findMany({
    where: { mentorId: me.id },
    orderBy: { startAt: "asc" },
    select: { id: true, mentorId: true, startAt: true, endAt: true, status: true, note: true },
  });

  return jsonOk(
    slots.map((s) => ({
      id: s.id,
      mentorId: s.mentorId,
      startAtIso: s.startAt.toISOString(),
      endAtIso: s.endAt.toISOString(),
      status: s.status,
      note: s.note,
    }))
  );
}

export async function POST(req: Request) {
  const me = await requireMentor().catch(() => null);
  if (!me) return jsonError("Unauthorized", 401);

  const parsed = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid input", 400);

  const { date, time, durationMins, note } = parsed.data;
  const startAt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(startAt.getTime())) return jsonError("Invalid date/time", 400);
  const endAt = new Date(startAt.getTime() + durationMins * 60 * 1000);

  const slot = await prisma.availabilitySlot.create({
    data: {
      mentorId: me.id,
      startAt,
      endAt,
      note,
    },
    select: { id: true, mentorId: true, startAt: true, endAt: true, status: true, note: true },
  });

  return jsonOk({
    id: slot.id,
    mentorId: slot.mentorId,
    startAtIso: slot.startAt.toISOString(),
    endAtIso: slot.endAt.toISOString(),
    status: slot.status,
    note: slot.note,
  });
}

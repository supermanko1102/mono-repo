import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

const CreateSlotBody = z.object({
  date: z.string().min(1).max(20),
  time: z.string().min(1).max(20),
  durationMins: z
    .number()
    .int()
    .min(15)
    .max(8 * 60),
  note: z.string().max(80).default(''),
});

@Controller('api/mentor')
export class MentorController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('slots')
  async slots(@Req() req: Request) {
    const me = await this.auth.requireMentor(req).catch(() => null);
    if (!me) return { ok: false, error: 'Unauthorized' };

    const slots = await this.prisma.availabilitySlot.findMany({
      where: { mentorId: me.id },
      orderBy: { startAt: 'asc' },
      select: {
        id: true,
        mentorId: true,
        startAt: true,
        endAt: true,
        status: true,
        note: true,
      },
    });

    return {
      ok: true,
      data: slots.map(
        (s: {
          id: string;
          mentorId: string;
          startAt: Date;
          endAt: Date;
          status: string;
          note: string;
        }) => ({
          id: s.id,
          mentorId: s.mentorId,
          startAtIso: s.startAt.toISOString(),
          endAtIso: s.endAt.toISOString(),
          status: s.status,
          note: s.note,
        }),
      ),
    };
  }

  @Post('slots')
  async createSlot(@Req() req: Request, @Body() body: unknown) {
    const me = await this.auth.requireMentor(req).catch(() => null);
    if (!me) return { ok: false, error: 'Unauthorized' };

    const parsed = CreateSlotBody.safeParse(body);
    if (!parsed.success) return { ok: false, error: 'Invalid input' };

    const { date, time, durationMins, note } = parsed.data;
    const startAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startAt.getTime()))
      return { ok: false, error: 'Invalid date/time' };
    const endAt = new Date(startAt.getTime() + durationMins * 60 * 1000);

    const slot = await this.prisma.availabilitySlot.create({
      data: { mentorId: me.id, startAt, endAt, note },
      select: {
        id: true,
        mentorId: true,
        startAt: true,
        endAt: true,
        status: true,
        note: true,
      },
    });

    return {
      ok: true,
      data: {
        id: slot.id,
        mentorId: slot.mentorId,
        startAtIso: slot.startAt.toISOString(),
        endAtIso: slot.endAt.toISOString(),
        status: slot.status,
        note: slot.note,
      },
    };
  }

  @Get('bookings')
  async bookings(@Req() req: Request) {
    const me = await this.auth.requireMentor(req).catch(() => null);
    if (!me) return { ok: false, error: 'Unauthorized' };

    const bookings = await this.prisma.booking.findMany({
      where: { mentorId: me.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { displayName: true, email: true } },
        upload: { select: { url: true } },
        slot: { select: { startAt: true, endAt: true } },
      },
    });

    return {
      ok: true,
      data: bookings.map(
        (b: {
          id: string;
          status: string;
          slotId: string;
          userId: string;
          mentorId: string;
          note: string;
          upload: { url: string } | null;
          createdAt: Date;
          user: { displayName: string; email: string };
          slot: { startAt: Date; endAt: Date };
        }) => ({
          id: b.id,
          status: b.status,
          slotId: b.slotId,
          userId: b.userId,
          mentorId: b.mentorId,
          note: b.note,
          uploadPath: b.upload?.url ?? null,
          createdAtIso: b.createdAt.toISOString(),
          userDisplayName: b.user.displayName,
          userEmail: b.user.email,
          slotStartAtIso: b.slot.startAt.toISOString(),
          slotEndAtIso: b.slot.endAt.toISOString(),
        }),
      ),
    };
  }
}

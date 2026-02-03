import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

const CreateBookingBody = z.object({
  slotId: z.string().min(1).max(80),
  note: z.string().max(500).default(''),
  uploadId: z.string().min(1).max(80).optional(),
});

@Controller('api/bookings')
export class BookingsController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() body: unknown) {
    const me = await this.auth.requireUser(req).catch(() => null);
    if (!me) return { ok: false, error: 'Unauthorized' };
    if (me.role !== 'VIBE_CODER') return { ok: false, error: 'Forbidden' };

    const parsed = CreateBookingBody.safeParse(body);
    if (!parsed.success) return { ok: false, error: 'Invalid input' };

    const { slotId, note, uploadId } = parsed.data;
    const slot = await this.prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });
    if (!slot) return { ok: false, error: 'Slot not found' };
    if (slot.status !== 'AVAILABLE')
      return { ok: false, error: 'Slot not available' };

    if (uploadId) {
      const upload = await this.prisma.upload.findUnique({
        where: { id: uploadId },
      });
      if (!upload || upload.ownerId !== me.id)
        return { ok: false, error: 'Invalid upload' };
    }

    try {
      const booking = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const updated = await tx.availabilitySlot.updateMany({
            where: { id: slotId, status: 'AVAILABLE' },
            data: { status: 'BOOKED' },
          });
          if (updated.count !== 1) throw new Error('SLOT_TAKEN');

          return tx.booking.create({
            data: {
              slotId,
              mentorId: slot.mentorId,
              userId: me.id,
              note,
              uploadId: uploadId ?? null,
            },
            include: { upload: { select: { url: true } }, slot: true },
          });
        },
      );

      return {
        ok: true,
        data: {
          id: booking.id,
          status: booking.status,
          slotId: booking.slotId,
          userId: booking.userId,
          mentorId: booking.mentorId,
          note: booking.note,
          uploadPath: booking.upload?.url ?? null,
          createdAtIso: booking.createdAt.toISOString(),
          slotStartAtIso: booking.slot.startAt.toISOString(),
          slotEndAtIso: booking.slot.endAt.toISOString(),
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'BOOKING_FAILED';
      if (msg === 'SLOT_TAKEN')
        return { ok: false, error: 'Slot not available' };
      return { ok: false, error: 'Booking failed' };
    }
  }
}

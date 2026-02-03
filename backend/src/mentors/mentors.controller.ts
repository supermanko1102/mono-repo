import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/mentors')
export class MentorsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const mentors = await this.prisma.user.findMany({
      where: { role: 'MENTOR' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, displayName: true, bio: true, avatarUrl: true },
    });
    return {
      ok: true,
      data: mentors.map(
        (m: {
          id: string;
          displayName: string;
          bio: string;
          avatarUrl: string | null;
        }) => ({
          id: m.id,
          displayName: m.displayName,
          bio: m.bio,
          avatarPath: m.avatarUrl ?? null,
        }),
      ),
    };
  }

  @Get(':mentorId')
  async detail(@Param('mentorId') mentorId: string) {
    const mentor = await this.prisma.user.findUnique({
      where: { id: mentorId, role: 'MENTOR' },
      select: { id: true, displayName: true, bio: true, avatarUrl: true },
    });
    if (!mentor) return { ok: false, error: 'Mentor not found' };

    const now = new Date();
    const slots = await this.prisma.availabilitySlot.findMany({
      where: { mentorId, status: 'AVAILABLE', startAt: { gt: now } },
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
      data: {
        mentor: {
          id: mentor.id,
          displayName: mentor.displayName,
          bio: mentor.bio,
          avatarPath: mentor.avatarUrl ?? null,
        },
        slots: slots.map(
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
      },
    };
  }
}

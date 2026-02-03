import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { MentorModule } from './mentor/mentor.module';
import { MentorsModule } from './mentors/mentors.module';
import { PrismaModule } from './prisma/prisma.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MentorsModule,
    MentorModule,
    BookingsModule,
    UploadsModule,
  ],
})
export class AppModule {}

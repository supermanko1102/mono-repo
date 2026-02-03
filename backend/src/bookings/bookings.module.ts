import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BookingsController],
})
export class BookingsModule {}

import { Module } from '@nestjs/common';
import { MentorController } from './mentor.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MentorController],
})
export class MentorModule {}

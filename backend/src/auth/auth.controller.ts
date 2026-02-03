import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';

const RegisterBody = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  role: z.enum(['VIBE_CODER', 'MENTOR']),
  displayName: z.string().min(1).max(60),
});

const LoginBody = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

@Controller('api')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  async me(@Req() req: Request) {
    const user = await this.auth.getCurrentUser(req);
    return { ok: true, data: user };
  }

  @Post('auth/register')
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = RegisterBody.safeParse(body);
    if (!parsed.success) return { ok: false, error: 'Invalid input' };

    try {
      const user = await this.auth.register(parsed.data);
      await this.auth.createSession(res, user.id);
      return {
        ok: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
        },
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'REGISTER_FAILED';
      if (msg === 'EMAIL_EXISTS')
        return { ok: false, error: 'Email already registered' };
      return { ok: false, error: 'Register failed' };
    }
  }

  @Post('auth/login')
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const parsed = LoginBody.safeParse(body);
    if (!parsed.success) return { ok: false, error: 'Invalid input' };

    try {
      const user = await this.auth.login(parsed.data);
      await this.auth.createSession(res, user.id);
      return {
        ok: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
        },
      };
    } catch {
      return { ok: false, error: 'Invalid credentials' };
    }
  }

  @Post('auth/logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req, res);
    return { ok: true, data: true };
  }
}

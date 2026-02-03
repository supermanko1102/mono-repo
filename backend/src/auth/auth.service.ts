import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import cookie from 'cookie';
import { PrismaService } from '../prisma/prisma.service';

const COOKIE_NAME = 'ms_session';
const SESSION_TTL_DAYS = 14;

export type AuthUser = {
  id: string;
  email: string;
  role: 'VIBE_CODER' | 'MENTOR';
  displayName: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private hmacSha256(input: string) {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET_MISSING');
    return crypto.createHmac('sha256', secret).update(input).digest('hex');
  }

  private getCookieToken(req: Request) {
    const raw = req.headers.cookie;
    if (!raw) return null;
    const parsed = cookie.parse(raw);
    return parsed[COOKIE_NAME] ?? null;
  }

  private setCookie(res: Response, token: string, expiresAt: Date) {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      expires: expiresAt,
    });
  }

  private clearCookie(res: Response) {
    res.clearCookie(COOKIE_NAME, { path: '/' });
  }

  async getCurrentUser(req: Request): Promise<AuthUser | null> {
    const token = this.getCookieToken(req);
    if (!token) return null;

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hmacSha256(token) },
      include: { user: true },
    });

    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      displayName: session.user.displayName,
    };
  }

  async requireUser(req: Request): Promise<AuthUser> {
    const user = await this.getCurrentUser(req);
    if (!user) throw new Error('UNAUTHORIZED');
    return user;
  }

  async requireMentor(req: Request): Promise<AuthUser> {
    const user = await this.requireUser(req);
    if (user.role !== 'MENTOR') throw new Error('FORBIDDEN');
    return user;
  }

  async register(input: {
    email: string;
    password: string;
    role: AuthUser['role'];
    displayName: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new Error('EMAIL_EXISTS');
    const passwordHash = await bcrypt.hash(input.password, 12);
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role,
        displayName: input.displayName,
      },
    });
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) throw new Error('INVALID_CREDENTIALS');
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new Error('INVALID_CREDENTIALS');
    return user;
  }

  async createSession(res: Response, userId: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: this.hmacSha256(token),
        expiresAt,
      },
    });
    this.setCookie(res, token, expiresAt);
  }

  async logout(req: Request, res: Response) {
    const token = this.getCookieToken(req);
    if (token) {
      await this.prisma.session.deleteMany({
        where: { tokenHash: this.hmacSha256(token) },
      });
    }
    this.clearCookie(res);
  }
}

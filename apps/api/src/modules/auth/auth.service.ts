import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { argon2Verify, argon2id } from 'hash-wasm';
import type { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

export const SESSION_COOKIE = 'eurozoo_session';
const SESSION_DAYS = 7;
const MAX_ATTEMPTS_PER_MINUTE = 5;
const MAX_ATTEMPTS_PER_HOUR = 10;
const LOCK_MINUTES = 15;

type Attempt = { at: number; ok: boolean };

@Injectable()
export class AuthService {
  private readonly attempts = new Map<string, Attempt[]>();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async hashPassword(password: string): Promise<string> {
    return argon2id({
      password,
      salt: randomBytes(16),
      parallelism: 1,
      iterations: 2,
      memorySize: 19456,
      hashLength: 32,
      outputType: 'encoded',
    });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2Verify({ password, hash });
    } catch {
      return false;
    }
  }

  async login(
    email: string,
    password: string,
    meta: { ip: string; userAgent: string },
  ): Promise<{ token: string; user: SessionUser }> {
    this.assertRateLimit(email, meta.ip);

    const user = await this.prisma.appUser.findUnique({ where: { email: email.toLowerCase() } });
    const valid = user ? await this.verifyPassword(password, user.passwordHash) : false;

    if (!user || !user.isActive || !valid) {
      this.recordAttempt(email, meta.ip, false);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    this.recordAttempt(email, meta.ip, true);

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt,
        userAgent: meta.userAgent.slice(0, 300),
        ip: meta.ip,
      },
    });

    await this.prisma.appUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  async resolveSession(token: string | undefined): Promise<SessionUser | null> {
    if (!token) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.hashToken(token) },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now() || !session.user.isActive) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    return {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      role: session.user.role,
    };
  }

  async logout(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.prisma.session
      .deleteMany({ where: { tokenHash: this.hashToken(token) } })
      .catch(() => undefined);
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }

  private assertRateLimit(email: string, ip: string): void {
    const now = Date.now();
    const recent = (this.attempts.get(ip) ?? []).filter((attempt) => now - attempt.at < 3600_000);
    const perMinute = recent.filter((attempt) => now - attempt.at < 60_000).length;
    const failures = recent.filter((attempt) => !attempt.ok);
    const lastFailure = failures.at(-1);

    if (perMinute >= MAX_ATTEMPTS_PER_MINUTE) {
      throw new UnauthorizedException('Слишком много попыток. Попробуйте позже.');
    }
    if (
      failures.length >= MAX_ATTEMPTS_PER_HOUR &&
      lastFailure &&
      now - lastFailure.at < LOCK_MINUTES * 60_000
    ) {
      throw new UnauthorizedException('Аккаунт временно заблокирован. Попробуйте позже.');
    }

    this.attempts.set(ip, recent);
    if (!this.attempts.has(email)) this.attempts.set(email, []);
  }

  private recordAttempt(email: string, ip: string, ok: boolean): void {
    const now = Date.now();
    for (const key of [ip, email]) {
      const list = (this.attempts.get(key) ?? []).filter((attempt) => now - attempt.at < 3600_000);
      list.push({ at: now, ok });
      this.attempts.set(key, list);
    }
  }
}

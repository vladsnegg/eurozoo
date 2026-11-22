import { Body, Controller, Get, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { parseQuery } from '../../common/http/query';
import { env } from '../../config/env';
import { AuthService, SESSION_COOKIE } from './auth.service';
import { SessionGuard } from './guards';

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
});

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('login')
  async login(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const credentials = parseQuery(loginSchema, body);
    const { token, user } = await this.auth.login(credentials.email, credentials.password, {
      ip: request.ip ?? 'unknown',
      userAgent: request.headers['user-agent'] ?? 'unknown',
    });

    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 86400000,
    });

    return { user };
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.cookies?.[SESSION_COOKIE] as string | undefined);
    response.clearCookie(SESSION_COOKIE, { path: '/' });
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@Req() request: Request) {
    return { user: request.user };
  }
}

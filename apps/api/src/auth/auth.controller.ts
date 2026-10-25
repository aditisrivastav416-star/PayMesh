import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { OwnerSession } from '@paymesh/shared';
import { Throttle } from '@nestjs/throttler';
import { AuthService, SESSION_AGE_MS, SESSION_COOKIE } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  async login(
    @Body() body: { email?: unknown; password?: unknown },
    @Res({ passthrough: true }) response: Response,
  ): Promise<OwnerSession> {
    if (typeof body?.email !== 'string' || typeof body?.password !== 'string') {
      throw new BadRequestException('Email and password are required');
    }
    const { token, user } = await this.auth.login(body.email, body.password);
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_AGE_MS,
      path: '/',
    });
    return user;
  }

  @Get('me')
  async me(@Req() request: Request): Promise<OwnerSession> {
    return this.auth.userForToken(request.cookies?.[SESSION_COOKIE]);
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(request.cookies?.[SESSION_COOKIE]);
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { status: 'ok' };
  }
}

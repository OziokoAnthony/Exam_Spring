import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  LoginSchema,
  ResetPasswordConfirmSchema,
  ResetPasswordSchema,
  SignupSchema,
  VerifyEmailSchema,
} from '@examspring/shared';

import { ok } from '../common/envelope';
import { RateLimit } from '../common/rate-limit.guard';
import { ZodPipe } from '../common/zod.pipe';
import { AuthService } from './auth.service';

const REFRESH_COOKIE = 'refresh_token';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/v1/auth',
  });
}

function readRefreshToken(req: Request, body: { refreshToken?: string }): string {
  const fromCookie = (req.cookies as Record<string, string | undefined> | undefined)?.[
    REFRESH_COOKIE
  ];
  return body.refreshToken ?? fromCookie ?? '';
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post('signup')
  @RateLimit(3, 60)
  async signup(@Body(new ZodPipe(SignupSchema)) dto: Parameters<AuthService['signup']>[0]) {
    const result = await this.auth.signup(dto);
    return ok(result);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimit(5, 60)
  async login(
    @Body(new ZodPipe(LoginSchema)) dto: Parameters<AuthService['login']>[0],
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto, req.headers['user-agent'], req.ip);
    setRefreshCookie(res, result.refreshToken);
    return ok({ user: result.user, accessToken: result.accessToken, expiresIn: result.expiresIn });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() body: { refreshToken?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = readRefreshToken(req, body);
    if (!token) throw new UnauthorizedException('Missing refresh token');
    const result = await this.auth.refresh(token, req.headers['user-agent'], req.ip);
    setRefreshCookie(res, result.refreshToken);
    return ok({ user: result.user, accessToken: result.accessToken, expiresIn: result.expiresIn });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: { refreshToken?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = readRefreshToken(req, body);
    if (token) await this.auth.logout(token);
    res.clearCookie(REFRESH_COOKIE, { path: '/v1/auth' });
    return ok({ loggedOut: true });
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @RateLimit(3, 60)
  async resetPassword(
    @Body(new ZodPipe(ResetPasswordSchema)) dto: Parameters<AuthService['requestPasswordReset']>[0],
  ) {
    const result = await this.auth.requestPasswordReset(dto);
    return ok(result);
  }

  @Post('reset-password/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmReset(
    @Body(new ZodPipe(ResetPasswordConfirmSchema))
    dto: Parameters<AuthService['confirmPasswordReset']>[0],
  ) {
    await this.auth.confirmPasswordReset(dto);
    return ok({ updated: true });
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @RateLimit(5, 60)
  async verifyEmail(
    @Body(new ZodPipe(VerifyEmailSchema)) dto: Parameters<AuthService['verifyEmail']>[0],
  ) {
    await this.auth.verifyEmail(dto);
    return ok({ verified: true });
  }
}

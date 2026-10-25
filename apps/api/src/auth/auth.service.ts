import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { verifyPassword } from './password';

export const SESSION_COOKIE = 'paymesh_session';
export const SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const token = randomBytes(32).toString('base64url');
    if (!user.active)
      throw new UnauthorizedException('Invalid email or password');
    await this.prisma.ownerSession.create({
      data: {
        tokenHash: tokenHash(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_AGE_MS),
      },
    });
    return { token, user: { id: user.id, email: user.email } };
  }

  async userForToken(token?: string) {
    if (!token) throw new UnauthorizedException();
    const session = await this.prisma.ownerSession.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt <= new Date() || !session.user.active) {
      throw new UnauthorizedException();
    }
    return { id: session.user.id, email: session.user.email };
  }

  async logout(token?: string) {
    if (token) {
      await this.prisma.ownerSession.deleteMany({
        where: { tokenHash: tokenHash(token) },
      });
    }
  }
}

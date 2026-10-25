import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { HealthResponse } from '@paymesh/shared';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { PrismaService } from './prisma.service';
import { PayPalService } from './paypal/paypal.service';

@Controller('health')
class HealthController {
  @Get()
  check(): HealthResponse {
    return { status: 'ok' };
  }
}

@Module({
  imports: [
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 30 }] }),
  ],
  controllers: [HealthController, AuthController],
  providers: [
    PrismaService,
    AuthService,
    PayPalService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { HealthResponse } from '@paymesh/shared';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { PrismaService } from './prisma.service';
import { PayPalService } from './paypal/paypal.service';
import { AgentsController } from './agents/agents.controller';
import { AgentsService } from './agents/agents.service';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';

@Controller('health')
class HealthController {
  @Get()
  check(): HealthResponse {
    return { status: 'ok' };
  }
}

@Module({
  // shortcut: Throttling is per API process; use shared storage when deploying multiple instances.
  imports: [
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 30 }] }),
  ],
  controllers: [
    HealthController,
    AuthController,
    AgentsController,
    PaymentsController,
  ],
  providers: [
    PrismaService,
    AuthService,
    PayPalService,
    AgentsService,
    PaymentsService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

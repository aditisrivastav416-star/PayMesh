import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AgentsService } from '../agents/agents.service';
import { AuthService, SESSION_COOKIE } from '../auth/auth.service';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(
    private readonly agents: AgentsService,
    private readonly auth: AuthService,
    private readonly payments: PaymentsService,
  ) {}

  private async owner(request: Request) {
    return (await this.auth.userForToken(request.cookies?.[SESSION_COOKIE])).id;
  }

  @Post('agent/payment-requests')
  async create(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const agent = await this.agents.authenticate(
      authorization?.replace(/^Bearer /, '') ?? '',
      'payment_requests:create',
    );
    return this.payments.create(agent, body);
  }

  @Get('payment-requests')
  list(
    @Req() request: Request,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.owner(request).then((id) =>
      this.payments.list(id, cursor, limit),
    );
  }

  @Get('payment-requests/summary')
  summary(@Req() request: Request) {
    return this.owner(request).then((id) => this.payments.summary(id));
  }

  @Post('payment-requests/:id/approve')
  approve(@Req() request: Request, @Param('id') id: string) {
    return this.owner(request).then((owner) =>
      this.payments.decide(owner, id, true),
    );
  }

  @Post('payment-requests/:id/reject')
  reject(@Req() request: Request, @Param('id') id: string) {
    return this.owner(request).then((owner) =>
      this.payments.decide(owner, id, false),
    );
  }

  @Post('payment-requests/:id/checkout')
  checkout(@Req() request: Request, @Param('id') id: string) {
    return this.owner(request).then((owner) =>
      this.payments.checkout(owner, id),
    );
  }

  @Post('payment-requests/:id/capture')
  capture(@Req() request: Request, @Param('id') id: string) {
    return this.owner(request).then((owner) =>
      this.payments.capture(owner, id),
    );
  }

  @Get('settings/limit')
  getLimit(@Req() request: Request) {
    return this.owner(request).then((owner) => this.payments.getLimit(owner));
  }

  @Put('settings/limit')
  setLimit(@Req() request: Request, @Body() body: { limit?: unknown }) {
    return this.owner(request).then((owner) =>
      this.payments.limit(owner, body?.limit),
    );
  }
}

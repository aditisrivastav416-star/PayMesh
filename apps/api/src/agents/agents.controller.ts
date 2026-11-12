import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, SESSION_COOKIE } from '../auth/auth.service';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(
    private readonly auth: AuthService,
    private readonly agents: AgentsService,
  ) {}

  private async owner(request: Request) {
    return this.auth.userForToken(request.cookies?.[SESSION_COOKIE]);
  }

  @Get()
  async list(@Req() request: Request) {
    return this.agents.list((await this.owner(request)).id);
  }

  @Post()
  async create(
    @Req() request: Request,
    @Body() body: { name?: unknown; description?: unknown },
  ) {
    return this.agents.create(
      (await this.owner(request)).id,
      body?.name,
      body?.description,
    );
  }

  @Post(':agentId/keys')
  async issueKey(
    @Req() request: Request,
    @Param('agentId') agentId: string,
    @Body() body: { scopes?: unknown; expiresAt?: unknown },
  ) {
    return this.agents.issueKey(
      (await this.owner(request)).id,
      agentId,
      body?.scopes,
      body?.expiresAt,
    );
  }

  @Delete(':agentId/keys/:keyId')
  async revokeKey(
    @Req() request: Request,
    @Param('agentId') agentId: string,
    @Param('keyId') keyId: string,
  ) {
    return this.agents.revokeKey(
      (await this.owner(request)).id,
      agentId,
      keyId,
    );
  }

  @Delete(':agentId')
  async deactivate(@Req() request: Request, @Param('agentId') agentId: string) {
    return this.agents.deactivate((await this.owner(request)).id, agentId);
  }
}

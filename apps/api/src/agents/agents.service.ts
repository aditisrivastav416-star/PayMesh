import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { AGENT_KEY_SCOPES, type AgentKeyScope } from '@paymesh/shared';
import { PrismaService } from '../prisma.service';

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(ownerId: string) {
    return this.prisma.agent.findMany({
      where: { ownerId },
      include: {
        keys: {
          select: {
            id: true,
            scopes: true,
            createdAt: true,
            expiresAt: true,
            revokedAt: true,
            lastUsedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(ownerId: string, name: unknown, description: unknown) {
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 100 ||
      (description !== undefined &&
        (typeof description !== 'string' || description.length > 500))
    ) {
      throw new BadRequestException(
        'Name is required (up to 100 characters); description must be up to 500 characters',
      );
    }
    return this.prisma.agent.create({
      data: {
        ownerId,
        name: name.trim(),
        description:
          typeof description === 'string' ? description.trim() || null : null,
      },
    });
  }

  private async ownedAgent(ownerId: string, agentId: string) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        agentId,
      )
    ) {
      throw new NotFoundException('Agent not found');
    }
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, ownerId },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async issueKey(
    ownerId: string,
    agentId: string,
    scopes: unknown,
    expiresAt: unknown,
  ) {
    const agent = await this.ownedAgent(ownerId, agentId);
    if (!agent.active) throw new BadRequestException('Agent is inactive');
    if (
      !Array.isArray(scopes) ||
      !scopes.length ||
      scopes.some((scope) => !AGENT_KEY_SCOPES.includes(scope)) ||
      new Set(scopes).size !== scopes.length
    ) {
      throw new BadRequestException('Choose a valid, unique scope');
    }
    let expiry: Date | undefined;
    if (expiresAt !== undefined && expiresAt !== null) {
      if (typeof expiresAt !== 'string')
        throw new BadRequestException('Invalid expiration');
      expiry = new Date(expiresAt);
      if (Number.isNaN(expiry.getTime()) || expiry <= new Date())
        throw new BadRequestException('Expiration must be in the future');
    }
    const key = `pm_sbx_${randomBytes(32).toString('base64url')}`;
    const record = await this.prisma.agentApiKey.create({
      data: { agentId, keyHash: hash(key), scopes, expiresAt: expiry },
    });
    return { id: record.id, key, scopes: record.scopes as AgentKeyScope[] };
  }

  async revokeKey(ownerId: string, agentId: string, keyId: string) {
    await this.ownedAgent(ownerId, agentId);
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        keyId,
      )
    ) {
      throw new NotFoundException('Active key not found');
    }
    const result = await this.prisma.agentApiKey.updateMany({
      where: { id: keyId, agentId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Active key not found');
    return { status: 'ok' };
  }

  async deactivate(ownerId: string, agentId: string) {
    await this.ownedAgent(ownerId, agentId);
    await this.prisma.$transaction([
      this.prisma.agent.update({
        where: { id: agentId },
        data: { active: false, deactivatedAt: new Date() },
      }),
      this.prisma.agentApiKey.updateMany({
        where: { agentId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { status: 'ok' };
  }

  async authenticate(key: string, scope: AgentKeyScope) {
    if (!/^pm_sbx_[A-Za-z0-9_-]{43}$/.test(key))
      throw new UnauthorizedException();
    const record = await this.prisma.agentApiKey.findUnique({
      where: { keyHash: hash(key) },
      include: { agent: true },
    });
    if (
      !record ||
      record.revokedAt ||
      (record.expiresAt && record.expiresAt <= new Date()) ||
      !record.agent.active ||
      !record.scopes.includes(scope)
    ) {
      throw new UnauthorizedException();
    }
    await this.prisma.agentApiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });
    return record.agent;
  }
}

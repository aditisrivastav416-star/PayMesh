import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { AgentsService } from '../src/agents/agents.service';
import type { PrismaService } from '../src/prisma.service';

const ownerId = '11111111-1111-4111-8111-111111111111';
const agentId = '22222222-2222-4222-8222-222222222222';
const keyId = '33333333-3333-4333-8333-333333333333';

test('issues a one-time scoped key, stores only its hash, and rejects it after revocation', async () => {
  let savedHash = '';
  let revoked = false;
  const prisma = {
    agent: {
      findFirst: async ({ where }: { where: { ownerId: string } }) =>
        where.ownerId === ownerId ? { id: agentId, active: true } : null,
    },
    agentApiKey: {
      create: async ({ data }: { data: { keyHash: string } }) => {
        savedHash = data.keyHash;
        return { id: keyId, scopes: ['payment_requests:create'] };
      },
      findUnique: async ({ where }: { where: { keyHash: string } }) =>
        where.keyHash === savedHash
          ? {
              id: keyId,
              revokedAt: revoked ? new Date() : null,
              expiresAt: null,
              scopes: ['payment_requests:create'],
              agent: { id: agentId, active: true },
            }
          : null,
      update: async () => ({}),
      updateMany: async () => {
        revoked = true;
        return { count: 1 };
      },
    },
  } as unknown as PrismaService;
  const service = new AgentsService(prisma);
  await assert.rejects(
    service.issueKey(ownerId, agentId, ['unknown'], undefined),
    { status: 400 },
  );
  const issued = await service.issueKey(
    ownerId,
    agentId,
    ['payment_requests:create'],
    undefined,
  );
  assert.match(issued.key, /^pm_sbx_[A-Za-z0-9_-]{43}$/);
  assert.equal(
    savedHash,
    createHash('sha256').update(issued.key).digest('hex'),
  );
  assert.equal(
    (await service.authenticate(issued.key, 'payment_requests:create')).id,
    agentId,
  );
  await service.revokeKey(ownerId, agentId, keyId);
  await assert.rejects(
    service.authenticate(issued.key, 'payment_requests:create'),
    { status: 401 },
  );
  await assert.rejects(
    service.issueKey(
      'other-owner',
      agentId,
      ['payment_requests:create'],
      undefined,
    ),
    { status: 404 },
  );
});

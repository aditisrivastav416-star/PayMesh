import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PaymentsService } from '../src/payments/payments.service';
import type { PrismaService } from '../src/prisma.service';
import type { PayPalService } from '../src/paypal/paypal.service';

test('payment requests enforce the limit and an approved request reaches PayPal once', async () => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const id = '22222222-2222-4222-8222-222222222222';
  let request: Record<string, unknown> = {};
  let creates = 0;
  let captures = 0;
  const prisma = {
    user: { findUniqueOrThrow: async () => ({ spendingLimitCents: 100 }) },
    paymentRequest: {
      create: async ({ data }: { data: Record<string, unknown> }) =>
        (request = { id, ...data }),
      findFirst: async () => request,
      updateMany: async ({
        where,
        data,
      }: {
        where: { status: string };
        data: Record<string, unknown>;
      }) => {
        if (request.status !== where.status) return { count: 0 };
        Object.assign(request, data);
        return { count: 1 };
      },
      update: async ({ data }: { data: Record<string, unknown> }) =>
        Object.assign(request, data),
    },
  } as unknown as PrismaService;
  const paypal = {
    createOrder: async () => {
      creates++;
      return {
        orderId: 'ORDER1234',
        approveUrl: 'https://www.sandbox.paypal.com/approve',
      };
    },
    captureOrder: async () => {
      captures++;
      return { status: 'COMPLETED', captureId: 'CAPTURE123' };
    },
  } as unknown as PayPalService;
  const service = new PaymentsService(prisma, paypal);
  await assert.rejects(
    service.create(
      { id: 'agent', ownerId },
      { amount: '-1.00', merchant: 'Store', purpose: 'Item' },
    ),
    { status: 400 },
  );
  await assert.rejects(
    service.create(
      { id: 'agent', ownerId },
      {
        amount: '1.00',
        merchant: 'Store',
        purpose: 'Item',
        aiProvider: 'unknown',
      },
    ),
    { status: 400 },
  );
  const created = await service.create(
    { id: 'agent', ownerId },
    { amount: '2.00', merchant: 'Store', purpose: 'Item' },
  );
  assert.equal(created.status, 'PENDING');
  await assert.rejects(service.checkout(ownerId, id), { status: 409 });
  await service.decide(ownerId, id, true);
  await service.checkout(ownerId, id);
  await service.checkout(ownerId, id);
  await service.capture(ownerId, id);
  await service.capture(ownerId, id);
  assert.equal(request.status, 'COMPLETED');
  assert.equal(creates, 1);
  assert.equal(captures, 1);
});

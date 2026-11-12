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

test('simultaneous calls reach PayPal once and stale retries recover', async () => {
  const ownerId = '11111111-1111-4111-8111-111111111111';
  const id = '22222222-2222-4222-8222-222222222222';
  let request = {
    id,
    ownerId,
    status: 'READY',
    amountCents: 100,
    orderId: null as string | null,
    updatedAt: new Date(),
  };
  let releaseCreate!: () => void;
  let releaseCapture!: () => void;
  const createGate = new Promise<void>((resolve) => (releaseCreate = resolve));
  const captureGate = new Promise<void>(
    (resolve) => (releaseCapture = resolve),
  );
  let creates = 0;
  let captures = 0;
  const prisma = {
    paymentRequest: {
      findFirst: async () => ({ ...request }),
      updateMany: async ({
        where,
        data,
      }: {
        where: { status: string; updatedAt?: { lt: Date } };
        data: { status: string };
      }) => {
        if (
          request.status !== where.status ||
          (where.updatedAt && request.updatedAt >= where.updatedAt.lt)
        )
          return { count: 0 };
        request = { ...request, ...data, updatedAt: new Date() };
        return { count: 1 };
      },
      update: async ({ data }: { data: Record<string, unknown> }) =>
        (request = { ...request, ...data } as typeof request),
    },
  } as unknown as PrismaService;
  const paypal = {
    createOrder: async () => {
      creates++;
      await createGate;
      return { orderId: 'ORDER1234', approveUrl: 'https://sandbox.paypal.com' };
    },
    captureOrder: async () => {
      captures++;
      await captureGate;
      return { status: 'COMPLETED', captureId: 'CAPTURE123' };
    },
  } as unknown as PayPalService;
  const service = new PaymentsService(prisma, paypal);
  const firstCheckout = service.checkout(ownerId, id);
  await new Promise((resolve) => setImmediate(resolve));
  await assert.rejects(service.checkout(ownerId, id), { status: 409 });
  releaseCreate();
  await firstCheckout;
  const firstCapture = service.capture(ownerId, id);
  await new Promise((resolve) => setImmediate(resolve));
  await assert.rejects(service.capture(ownerId, id), { status: 409 });
  releaseCapture();
  await firstCapture;
  assert.equal(creates, 1);
  assert.equal(captures, 1);
  request = {
    ...request,
    status: 'CREATING',
    orderId: null,
    updatedAt: new Date(Date.now() - 31_000),
  };
  await service.checkout(ownerId, id);
  request = {
    ...request,
    status: 'CAPTURING',
    updatedAt: new Date(Date.now() - 31_000),
  };
  await service.capture(ownerId, id);
  assert.equal(creates, 2);
  assert.equal(captures, 2);
});

test('payment reads use bounded pages and aggregate counts', async () => {
  let listArgs: Record<string, unknown> = {};
  const prisma = {
    paymentRequest: {
      findMany: async (args: Record<string, unknown>) => {
        listArgs = args;
        return [{ id: 'first' }, { id: 'second' }, { id: 'third' }];
      },
      groupBy: async () => [
        { status: 'PENDING', _count: { _all: 2 }, _sum: { amountCents: 250 } },
        {
          status: 'COMPLETED',
          _count: { _all: 1 },
          _sum: { amountCents: 100 },
        },
      ],
    },
  } as unknown as PrismaService;
  const service = new PaymentsService(prisma, {} as PayPalService);
  const page = await service.list('owner', undefined, '2');
  assert.equal(listArgs.take, 3);
  assert.equal(page.items.length, 2);
  assert.equal(page.nextCursor, 'second');
  assert.deepEqual(await service.summary('owner'), {
    total: 3,
    pending: 2,
    completed: 1,
    completedCents: 100,
  });
  await assert.rejects(service.list('owner', undefined, '500'), {
    status: 400,
  });
  await assert.rejects(service.list('owner', 'not-a-uuid'), { status: 400 });
});

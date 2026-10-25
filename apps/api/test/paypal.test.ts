import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { PayPalService } from '../src/paypal/paypal.service';

const originalFetch = global.fetch;
const originalEnv = { ...process.env };
afterEach(() => {
  global.fetch = originalFetch;
  process.env = { ...originalEnv };
});

test('sandbox order requires payer approval before capture', async () => {
  process.env.PAYPAL_ENV = 'sandbox';
  process.env.PAYPAL_CLIENT_ID = 'sandbox-id';
  process.env.PAYPAL_CLIENT_SECRET = 'sandbox-secret';
  const calls: { url: string; init: RequestInit }[] = [];
  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init: init ?? {} });
    const result =
      calls.length === 1
        ? { access_token: 'token', expires_in: 3600 }
        : calls.length === 2
          ? {
              id: 'TESTORDER123',
              status: 'CREATED',
              links: [
                {
                  rel: 'approve',
                  href: 'https://www.sandbox.paypal.com/approve',
                },
              ],
            }
          : {
              id: 'TESTORDER123',
              status: 'COMPLETED',
              purchase_units: [
                {
                  payments: {
                    captures: [{ id: 'CAPTURE123', status: 'COMPLETED' }],
                  },
                },
              ],
            };
    return new Response(JSON.stringify(result), { status: 200 });
  };
  const paypal = new PayPalService();
  const order = await paypal.createOrder('1.00', 'create-request');
  assert.equal(order.approveUrl, 'https://www.sandbox.paypal.com/approve');
  const captured = await paypal.captureOrder(order.orderId);
  assert.equal(captured.captureId, 'CAPTURE123');
  assert.equal(calls.length, 3);
  assert.equal(
    (calls[1].init.headers as Record<string, string>)['PayPal-Request-Id'],
    'create-request',
  );
  assert.equal(
    (calls[2].init.headers as Record<string, string>)['PayPal-Request-Id'],
    'paymesh-capture-TESTORDER123',
  );
  assert.match(calls[1].url, /^https:\/\/api-m\.sandbox\.paypal\.com\//);
});

test('rejects invalid amounts before contacting PayPal', async () => {
  const paypal = new PayPalService();
  await assert.rejects(
    paypal.createOrder('-1.00', 'request'),
    /Amount must be/,
  );
});

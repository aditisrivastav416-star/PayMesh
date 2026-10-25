import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PayPalService } from '../src/paypal/paypal.service';

async function main() {
  if (process.env.PAYPAL_ENV !== 'sandbox') {
    throw new Error('The smoke test requires PAYPAL_ENV=sandbox');
  }
  const paypal = new PayPalService();
  const command = process.argv[2];
  if (command === 'create') {
    const order = await paypal.createOrder('1.00', randomUUID());
    console.log(`Order: ${order.orderId}`);
    console.log(`Approve as the sandbox buyer: ${order.approveUrl}`);
    console.log(
      `After approval run: pnpm --filter @paymesh/api paypal:smoke capture ${order.orderId}`,
    );
  } else if (command === 'capture' && process.argv[3]) {
    console.log(await paypal.captureOrder(process.argv[3]));
  } else {
    throw new Error(
      'Usage: pnpm --filter @paymesh/api paypal:smoke create|capture ORDER_ID',
    );
  }
}

void main();

# PayPal Sandbox setup

1. In the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/), create a **Sandbox** REST app for the sandbox business account. Create or select a separate sandbox personal buyer account.
2. Copy the app's client ID and secret into `apps/api/.env` as `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`. Keep `PAYPAL_ENV=sandbox`. Never place the secret in `apps/web` or commit the `.env` file.
3. Set `PAYPAL_WEBHOOK_ID` when you add a webhook for the future payment-status integration. Phase 0 does not receive webhooks yet.
4. With the API dependencies installed, run:

   ```sh
   pnpm --filter @paymesh/api paypal:smoke create
   ```

   The command creates a $1.00 USD sandbox order and prints its approval URL and order ID. Open that URL and approve as the **sandbox buyer**.
5. After approval, run the printed capture command:

   ```sh
   pnpm --filter @paymesh/api paypal:smoke capture ORDER_ID
   ```

   A successful result has `status: 'COMPLETED'` and a `captureId`. The create and capture calls use separate PayPal request IDs; retries of a capture reuse the ID derived from its order ID.

The smoke test uses the app's sandbox merchant account. Its $1.00 amount is fixed in code. This developer-only test is separate from PayMesh payment authorization; no agent or dashboard route can invoke it.

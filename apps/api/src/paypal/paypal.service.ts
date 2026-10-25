import { Injectable } from '@nestjs/common';

type PayPalOrder = {
  id: string;
  status: string;
  links?: { rel: string; href: string }[];
  purchase_units?: {
    payments?: { captures?: { id: string; status: string }[] };
  }[];
};

@Injectable()
export class PayPalService {
  private token?: { value: string; expiresAt: number };

  private get baseUrl() {
    if (process.env.PAYPAL_ENV !== 'sandbox')
      throw new Error('PayPal Sandbox is required');
    return 'https://api-m.sandbox.paypal.com';
  }

  async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now())
      return this.token.value;
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    if (
      !clientId ||
      !secret ||
      clientId.startsWith('replace-with-') ||
      secret.startsWith('replace-with-')
    ) {
      throw new Error(
        'Configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in apps/api/.env',
      );
    }
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok)
      throw new Error(`PayPal OAuth failed (${response.status})`);
    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    if (!data.access_token)
      throw new Error('PayPal OAuth response did not include an access token');
    this.token = {
      value: data.access_token,
      expiresAt: Date.now() + Math.max(0, data.expires_in - 60) * 1000,
    };
    return data.access_token;
  }

  private async orderRequest(
    path: string,
    requestId: string,
    body?: object,
  ): Promise<PayPalOrder> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await this.accessToken()}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': requestId,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok)
      throw new Error(`PayPal order request failed (${response.status})`);
    return (await response.json()) as PayPalOrder;
  }

  async createOrder(value: string, requestId: string) {
    if (!/^(?:0|[1-9]\d*)\.\d{2}$/.test(value) || Number(value) <= 0) {
      throw new Error(
        'Amount must be a positive USD value with two decimal places',
      );
    }
    const order = await this.orderRequest('/v2/checkout/orders', requestId, {
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: 'USD', value } }],
    });
    const approveUrl = order.links?.find(
      (link) => link.rel === 'approve',
    )?.href;
    if (!order.id || !approveUrl)
      throw new Error('PayPal did not return an order approval URL');
    return { orderId: order.id, approveUrl, status: order.status };
  }

  async captureOrder(orderId: string) {
    if (!/^[A-Z0-9]{8,32}$/.test(orderId))
      throw new Error('Invalid PayPal order ID');
    const order = await this.orderRequest(
      `/v2/checkout/orders/${orderId}/capture`,
      `paymesh-capture-${orderId}`,
    );
    return {
      orderId: order.id,
      status: order.status,
      captureId: order.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null,
    };
  }
}

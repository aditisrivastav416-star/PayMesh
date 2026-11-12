import type {
  Agent,
  ApiErrorResponse,
  IssuedAgentKey,
  OwnerSession,
  PaymentPage,
  PaymentRequest,
  PaymentSummary,
} from '@paymesh/shared';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as ApiErrorResponse | null;
    throw new Error(body?.message ?? `API request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export const api = {
  paymentRequests: async (
    cursor?: string,
    limit = 20,
  ): Promise<PaymentPage> => {
    const result = await request<PaymentPage | PaymentRequest[]>(
      `/payment-requests?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    );
    if (Array.isArray(result)) return { items: result, nextCursor: null };
    if (!result || !Array.isArray(result.items))
      throw new Error('Unexpected payment response. Restart the PayMesh API.');
    return result;
  },
  paymentSummary: () => request<PaymentSummary>('/payment-requests/summary'),
  paymentAction: (
    id: string,
    action: 'approve' | 'reject' | 'checkout' | 'capture',
  ) =>
    request<PaymentRequest>(`/payment-requests/${id}/${action}`, {
      method: 'POST',
    }),
  spendingLimit: () =>
    request<{ spendingLimitCents: number }>('/settings/limit'),
  setSpendingLimit: (limit: string) =>
    request<{ spendingLimitCents: number }>('/settings/limit', {
      method: 'PUT',
      body: JSON.stringify({ limit }),
    }),
  agents: () => request<Agent[]>('/agents'),
  createAgent: (name: string, description: string) =>
    request<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  issueAgentKey: (agentId: string) =>
    request<IssuedAgentKey>(`/agents/${agentId}/keys`, {
      method: 'POST',
      body: JSON.stringify({ scopes: ['payment_requests:create'] }),
    }),
  revokeAgentKey: (agentId: string, keyId: string) =>
    request<{ status: 'ok' }>(`/agents/${agentId}/keys/${keyId}`, {
      method: 'DELETE',
    }),
  deactivateAgent: (agentId: string) =>
    request<{ status: 'ok' }>(`/agents/${agentId}`, { method: 'DELETE' }),
  login: (email: string, password: string) =>
    request<OwnerSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ status: 'ok' }>('/auth/logout', { method: 'POST' }),
};

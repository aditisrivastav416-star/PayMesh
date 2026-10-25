import type { ApiErrorResponse, OwnerSession } from '@paymesh/shared';

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
  login: (email: string, password: string) =>
    request<OwnerSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ status: 'ok' }>('/auth/logout', { method: 'POST' }),
};

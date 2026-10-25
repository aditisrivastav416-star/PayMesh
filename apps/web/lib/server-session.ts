import { cookies } from 'next/headers';
import type { OwnerSession } from '@paymesh/shared';

export async function getSession(): Promise<OwnerSession | null> {
  const cookie = (await cookies()).toString();
  if (!cookie) return null;
  try {
    const response = await fetch(
      `${process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3001'}/auth/me`,
      {
        headers: { Cookie: cookie },
        cache: 'no-store',
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as OwnerSession;
  } catch {
    return null;
  }
}

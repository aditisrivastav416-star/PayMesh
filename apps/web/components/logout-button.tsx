'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className="mt-3"
      onClick={async () => {
        await api.logout();
        router.push('/login');
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}

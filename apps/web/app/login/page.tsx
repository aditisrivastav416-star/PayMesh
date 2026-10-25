'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    try {
      await api.login(String(form.get('email')), String(form.get('password')));
      router.push('/');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign in');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto mt-24 max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-bold tracking-widest text-blue-700 uppercase">
        PayMesh
      </p>
      <h1 className="mt-3 text-3xl font-semibold">Owner sign in</h1>
      <p className="mt-2 text-slate-600">
        Manage agent permissions and payment approvals.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="block text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            className="mt-1 w-full rounded-md border border-slate-300 p-2"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-md border border-slate-300 p-2"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </main>
  );
}

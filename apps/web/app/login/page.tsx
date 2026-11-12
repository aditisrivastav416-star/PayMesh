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
    <main className="panel mx-auto mt-16 max-w-md p-8 sm:mt-24 sm:p-10">
      <p className="page-eyebrow">PayMesh</p>
      <h1 className="page-title">Welcome back</h1>
      <p className="page-subtitle">
        Manage agent permissions and payment approvals.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <label className="field-label">
          Email
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            className="field"
          />
        </label>
        <label className="field-label">
          Password
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field"
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

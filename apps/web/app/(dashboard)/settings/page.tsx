'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { ShieldCheck } from 'lucide-react';

export default function SettingsPage() {
  const [limit, setLimit] = useState('1.00');
  const [message, setMessage] = useState('');
  useEffect(() => {
    void api
      .spendingLimit()
      .then((result) => setLimit((result.spendingLimitCents / 100).toFixed(2)))
      .catch((e: Error) => setMessage(e.message));
  }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    try {
      await api.setSpendingLimit(limit);
      setMessage('Limit saved. Requests above it require approval.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save limit');
    }
  }
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="page-eyebrow">Policy settings</p>
        <h1 className="page-title">Spending rule</h1>
        <p className="page-subtitle">
          Choose the amount an agent can request before it needs your explicit
          approval.
        </p>
      </div>
      <form
        onSubmit={(event) => void save(event)}
        className="panel space-y-5 p-6 sm:p-8"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-teal-50 p-3 text-teal-700">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h2 className="font-bold">Per-purchase approval threshold</h2>
            <p className="text-sm text-slate-500">
              Amounts above this limit wait for your review.
            </p>
          </div>
        </div>
        <label className="field-label">
          Limit in USD
          <input
            required
            inputMode="decimal"
            pattern="[0-9]+\.[0-9]{2}"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            className="field max-w-xs text-lg font-semibold"
          />
        </label>
        <button className="btn-primary">Save limit</button>
      </form>
      {message && (
        <p role="status" className="text-sm font-medium text-teal-700">
          {message}
        </p>
      )}
    </div>
  );
}

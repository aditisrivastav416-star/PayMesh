'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';

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
    <div className="max-w-xl space-y-5">
      <h1 className="text-3xl font-semibold">Spending rule</h1>
      <p>
        Requests at or below this USD amount are ready for checkout. Higher
        requests need your approval.
      </p>
      <form
        onSubmit={(event) => void save(event)}
        className="space-y-3 rounded-lg border bg-white p-5"
      >
        <label className="block">
          Per-purchase limit (USD)
          <input
            required
            inputMode="decimal"
            pattern="[0-9]+\.[0-9]{2}"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
            className="mt-2 block w-full rounded border p-2"
          />
        </label>
        <button className="rounded bg-blue-700 px-4 py-2 text-white">
          Save limit
        </button>
      </form>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

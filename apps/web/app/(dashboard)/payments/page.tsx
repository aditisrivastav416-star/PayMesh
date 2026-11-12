'use client';

import { useEffect, useState } from 'react';
import type { PaymentRequest } from '@paymesh/shared';
import { api } from '@/lib/api';

export default function PaymentsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    void api
      .paymentRequests()
      .then(setRequests)
      .catch((e: Error) => setError(e.message));
  }, []);
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-3xl font-semibold">Payment history</h1>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {requests.length === 0 && <p>No requests yet.</p>}
      {requests.map((request) => (
        <article key={request.id} className="rounded-lg border bg-white p-5">
          <div className="flex justify-between">
            <strong>
              {request.merchant} · ${(request.amountCents / 100).toFixed(2)}
            </strong>
            <span>{request.status.replaceAll('_', ' ')}</span>
          </div>
          <p className="mt-2">{request.purpose}</p>
          <p className="mt-2 text-sm text-slate-500">
            {new Date(request.createdAt).toLocaleString()} ·{' '}
            {request.agent?.name ?? 'Agent'}
          </p>
          {request.captureId && (
            <p className="mt-2 break-all text-sm">
              PayPal capture: {request.captureId}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

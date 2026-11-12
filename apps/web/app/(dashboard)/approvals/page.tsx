'use client';

import { useEffect, useState } from 'react';
import type { PaymentRequest } from '@paymesh/shared';
import { api } from '@/lib/api';

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void api
      .paymentRequests()
      .then(setRequests)
      .catch((e: Error) => setError(e.message));
  }, []);
  async function act(
    id: string,
    action: 'approve' | 'reject' | 'checkout' | 'capture',
  ) {
    setBusy(true);
    setError('');
    try {
      const changed = await api.paymentAction(id, action);
      setRequests((current) =>
        current.map((request) =>
          request.id === id ? { ...request, ...changed } : request,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-3xl font-semibold">Approvals and checkout</h1>
      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}
      {requests.length === 0 && (
        <p>No payment requests yet. Run the demo agent to create one.</p>
      )}
      {requests.map((request) => (
        <article key={request.id} className="rounded-lg border bg-white p-5">
          <div className="flex justify-between gap-3">
            <strong>
              {request.merchant} · ${(request.amountCents / 100).toFixed(2)}
            </strong>
            <span>{request.status.replaceAll('_', ' ')}</span>
          </div>
          <p className="mt-2">{request.purpose}</p>
          <p className="text-sm text-slate-500">
            Requested by {request.agent?.name ?? 'Agent'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {request.status === 'PENDING' && (
              <>
                <button
                  disabled={busy}
                  onClick={() => void act(request.id, 'approve')}
                  className="rounded bg-blue-700 px-3 py-2 text-white"
                >
                  Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => void act(request.id, 'reject')}
                  className="rounded border px-3 py-2"
                >
                  Reject
                </button>
              </>
            )}
            {['READY', 'CREATING'].includes(request.status) && (
              <button
                disabled={busy}
                onClick={() => void act(request.id, 'checkout')}
                className="rounded bg-blue-700 px-3 py-2 text-white"
              >
                Create PayPal checkout
              </button>
            )}
            {request.status === 'AWAITING_BUYER' && (
              <>
                <a
                  href={request.approveUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-blue-700 px-3 py-2 text-white"
                >
                  Approve in PayPal Sandbox
                </a>
                <button
                  disabled={busy}
                  onClick={() => void act(request.id, 'capture')}
                  className="rounded border px-3 py-2"
                >
                  Capture after buyer approval
                </button>
              </>
            )}
            {request.status === 'CAPTURING' && (
              <button
                disabled={busy}
                onClick={() => void act(request.id, 'capture')}
                className="rounded border px-3 py-2"
              >
                Retry capture
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

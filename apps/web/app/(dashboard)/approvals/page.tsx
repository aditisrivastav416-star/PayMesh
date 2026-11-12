'use client';

import { useEffect, useState } from 'react';
import type { PaymentRequest } from '@paymesh/shared';
import { api } from '@/lib/api';
import { PaymentStatus } from '@/components/payment-status';
import { ExternalLink, ShieldCheck } from 'lucide-react';

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void api
      .paymentRequests()
      .then((page) => {
        setRequests(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch((e: Error) => setError(e.message));
  }, []);
  async function loadMore() {
    if (!nextCursor) return;
    setBusy(true);
    try {
      const page = await api.paymentRequests(nextCursor);
      setRequests((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load requests');
    } finally {
      setBusy(false);
    }
  }
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
    <div className="space-y-6">
      <div>
        <p className="page-eyebrow">Review queue</p>
        <h1 className="page-title">Approvals & checkout</h1>
        <p className="page-subtitle">
          Review agent requests, start sandbox checkout, and capture after the
          buyer approves.
        </p>
      </div>
      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}
      {requests.length === 0 && (
        <div className="empty-state">
          <ShieldCheck className="mx-auto mb-3 text-teal-600" size={28} />
          <p className="font-semibold text-slate-700">Nothing to review yet</p>
          <p className="mt-1 text-sm">
            Run the demo agent to create a request.
          </p>
        </div>
      )}
      {requests.map((request) => (
        <article key={request.id} className="panel p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {request.agent?.name ?? 'Agent'} ·{' '}
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
              <h2 className="mt-2 text-lg font-bold">{request.merchant}</h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold">
                ${(request.amountCents / 100).toFixed(2)}
              </span>
              <PaymentStatus status={request.status} />
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {request.purpose}
          </p>
          {request.aiReason && (
            <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/60 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
                {request.aiProvider} decision
              </p>
              {request.task && (
                <p className="mt-2 text-sm text-slate-600">
                  Goal: {request.task}
                </p>
              )}
              <p className="mt-1 text-sm font-medium text-slate-800">
                {request.aiReason}
              </p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            {request.status === 'PENDING' && (
              <>
                <button
                  disabled={busy}
                  onClick={() => void act(request.id, 'approve')}
                  className="btn-primary"
                >
                  Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => void act(request.id, 'reject')}
                  className="btn-danger"
                >
                  Reject
                </button>
              </>
            )}
            {['READY', 'CREATING'].includes(request.status) && (
              <button
                disabled={busy}
                onClick={() => void act(request.id, 'checkout')}
                className="btn-primary"
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
                  className="btn-primary"
                >
                  Approve in PayPal Sandbox{' '}
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
                <button
                  disabled={busy}
                  onClick={() => void act(request.id, 'capture')}
                  className="btn-secondary"
                >
                  Capture after buyer approval
                </button>
              </>
            )}
            {request.status === 'CAPTURING' && (
              <button
                disabled={busy}
                onClick={() => void act(request.id, 'capture')}
                className="btn-secondary"
              >
                Retry capture
              </button>
            )}
          </div>
        </article>
      ))}
      {nextCursor && (
        <button
          disabled={busy}
          onClick={() => void loadMore()}
          className="btn-secondary"
        >
          Load more requests
        </button>
      )}
    </div>
  );
}

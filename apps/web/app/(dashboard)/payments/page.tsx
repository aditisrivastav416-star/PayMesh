'use client';

import { useEffect, useState } from 'react';
import type { PaymentRequest } from '@paymesh/shared';
import { api } from '@/lib/api';
import { PaymentStatus } from '@/components/payment-status';
import { ReceiptText } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <p className="page-eyebrow">Transaction ledger</p>
        <h1 className="page-title">Payment history</h1>
        <p className="page-subtitle">
          Follow every request from agent proposal to completed sandbox capture.
        </p>
      </div>
      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}
      {requests.length === 0 && (
        <div className="empty-state">
          <ReceiptText className="mx-auto mb-3 text-teal-600" size={28} />
          No requests yet.
        </div>
      )}
      {requests.map((request) => (
        <article key={request.id} className="panel p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {new Date(request.createdAt).toLocaleString()} ·{' '}
                {request.agent?.name ?? 'Agent'}
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
          <p className="mt-4 text-sm text-slate-600">{request.purpose}</p>
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
          {request.captureId && (
            <p className="mt-4 break-all border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
              PayPal capture ID:{' '}
              <span className="font-mono text-slate-700">
                {request.captureId}
              </span>
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

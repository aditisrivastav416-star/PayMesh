'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  CircleCheck,
  Clock3,
  ShieldCheck,
} from 'lucide-react';
import type { PaymentRequest, PaymentSummary } from '@paymesh/shared';
import { api } from '@/lib/api';
import { PaymentStatus } from '@/components/payment-status';

export default function OverviewPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    total: 0,
    pending: 0,
    completed: 0,
    completedCents: 0,
  });
  const [error, setError] = useState('');
  useEffect(() => {
    void Promise.all([api.paymentRequests(undefined, 4), api.paymentSummary()])
      .then(([page, totals]) => {
        setRequests(page.items);
        setSummary(totals);
      })
      .catch((e: Error) => setError(e.message));
  }, []);
  return (
    <div className="space-y-8">
      <div>
        <p className="page-eyebrow">Workspace overview</p>
        <h1 className="page-title">Payment control, at a glance.</h1>
        <p className="page-subtitle">
          See what your AI agents are requesting, what needs approval, and what
          PayPal has completed.
        </p>
      </div>
      {error && (
        <p role="alert" className="alert-error">
          {error}
        </p>
      )}
      <section
        className="grid gap-4 sm:grid-cols-3"
        aria-label="Payment summary"
      >
        {[
          {
            label: 'Total requests',
            value: summary.total,
            icon: Bot,
            note: 'Submitted by agents',
          },
          {
            label: 'Needs approval',
            value: summary.pending,
            icon: Clock3,
            note: 'Waiting for your decision',
          },
          {
            label: 'Completed',
            value: summary.completed,
            icon: CircleCheck,
            note: `$${(summary.completedCents / 100).toFixed(2)} in sandbox payments`,
          },
        ].map(({ label, value, icon: Icon, note }) => (
          <div key={label} className="panel p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <span className="rounded-xl bg-teal-50 p-2 text-teal-700">
                <Icon size={19} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </div>
        ))}
      </section>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold">Recent activity</h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest agent requests
              </p>
            </div>
            <Link
              href="/payments"
              className="flex items-center gap-1 text-sm font-bold text-teal-700 hover:underline"
            >
              View all <ArrowRight size={15} />
            </Link>
          </div>
          {requests.length === 0 ? (
            <div className="empty-state m-5">
              No requests yet. Run the demo agent to get started.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.slice(0, 4).map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
                >
                  <div>
                    <p className="font-semibold">{request.merchant}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {request.agent?.name ?? 'Agent'} ·{' '}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">
                      ${(request.amountCents / 100).toFixed(2)}
                    </span>
                    <PaymentStatus status={request.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-2xl bg-[#102f46] p-6 text-white">
          <span className="inline-flex rounded-xl bg-white/10 p-3 text-teal-300">
            <ShieldCheck size={24} />
          </span>
          <h2 className="mt-6 text-xl font-bold">
            Your rules stay in control.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            AI proposes a purchase. PayMesh checks your limit before it can
            reach PayPal checkout.
          </p>
          <Link
            href="/settings"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-teal-300 hover:underline"
          >
            Manage spending rule <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}

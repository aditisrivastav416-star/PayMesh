import Link from 'next/link';

export default function OverviewPage() {
  return (
    <>
      <p className="text-sm font-semibold tracking-widest text-blue-700 uppercase">
        Overview
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Payment authorization</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        AI agents propose sandbox purchases. PayMesh checks your spending rule,
        routes higher amounts for approval, and records PayPal checkout results.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/agents"
          className="rounded bg-blue-700 px-4 py-2 text-white"
        >
          Set up an agent
        </Link>
        <Link href="/settings" className="rounded border px-4 py-2">
          Set spending limit
        </Link>
        <Link href="/approvals" className="rounded border px-4 py-2">
          Review requests
        </Link>
      </div>
    </>
  );
}

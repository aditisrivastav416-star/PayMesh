export default function OverviewPage() {
  return (
    <>
      <p className="text-sm font-semibold tracking-widest text-blue-700 uppercase">
        Overview
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Payment authorization</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Agents request purchases. PayMesh will enforce owner-defined policies
        before any PayPal checkout begins.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {['Agents', 'Pending approvals', 'Payments'].map((label) => (
          <section
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h2 className="text-sm font-medium text-slate-500">{label}</h2>
            <p className="mt-3 text-2xl font-semibold">—</p>
          </section>
        ))}
      </div>
    </>
  );
}

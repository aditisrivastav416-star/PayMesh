import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server-session';
import { LogoutButton } from '@/components/logout-button';
import { DashboardNav } from '@/components/dashboard-nav';
import { WalletCards } from 'lucide-react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const owner = await getSession();
  if (!owner) redirect('/login');

  return (
    <div className="app-shell md:flex">
      <aside className="sidebar w-full p-5 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:p-6">
        <Link
          href="/"
          className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-white"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-teal-400 text-slate-900">
            <WalletCards size={22} aria-hidden="true" />
          </span>
          PayMesh
        </Link>
        <p className="mt-3 hidden text-xs font-medium tracking-wide text-slate-400 md:block">
          AI PAYMENT CONTROL
        </p>
        <div className="mt-5 md:mt-10">
          <DashboardNav />
        </div>
        <div className="mt-5 border-t border-white/10 pt-5 text-sm text-slate-300 md:mt-auto">
          <p className="mb-1 text-xs uppercase tracking-widest text-slate-400">
            Owner account
          </p>
          <p className="truncate font-medium text-white">{owner.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 md:px-10 md:py-10 lg:px-14">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

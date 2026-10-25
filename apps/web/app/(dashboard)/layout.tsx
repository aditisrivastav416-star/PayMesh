import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/server-session';
import { LogoutButton } from '@/components/logout-button';

const links = [
  { href: '/', label: 'Overview' },
  { href: '/agents', label: 'Agents' },
  { href: '/approvals', label: 'Approvals' },
  { href: '/payments', label: 'Payments' },
  { href: '/settings', label: 'Settings' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const owner = await getSession();
  if (!owner) redirect('/login');

  return (
    <div className="min-h-screen md:flex">
      <aside className="w-full border-b border-slate-200 bg-white p-6 md:min-h-screen md:w-64 md:border-r md:border-b-0">
        <Link href="/" className="text-xl font-bold text-blue-700">
          PayMesh
        </Link>
        <nav
          aria-label="Dashboard"
          className="mt-8 flex gap-2 overflow-x-auto md:flex-col"
        >
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-500">
          <p className="truncate">{owner.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}

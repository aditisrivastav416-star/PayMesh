'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Bot,
  ShieldCheck,
  ReceiptText,
  SlidersHorizontal,
} from 'lucide-react';

const links = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/approvals', label: 'Approvals', icon: ShieldCheck },
  { href: '/payments', label: 'Payments', icon: ReceiptText },
  { href: '/settings', label: 'Settings', icon: SlidersHorizontal },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Dashboard"
      className="flex gap-1 overflow-x-auto md:flex-col"
    >
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? 'page' : undefined}
          className={`sidebar-link shrink-0 ${pathname === href ? 'active' : ''}`}
        >
          <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

import Link from "next/link";

import { getOpenSession } from "@/lib/sessions/queries";
import { createClient } from "@/lib/supabase/server";

import { CurrentSessionCard } from "@/components/admin/current-session-card";

export const metadata = { title: "Admin Dashboard" };

const quickLinks = [
  { href: "/admin/scanner", label: "Scanner", description: "Scan QR codes to check children in." },
  { href: "/admin/sessions", label: "Sessions", description: "Open or close today's session." },
  { href: "/admin/guardians", label: "Guardians", description: "Search registered families." },
  { href: "/admin/children", label: "Children", description: "Search, correct, archive records." },
];

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [openSession, { count: activeChildren }] = await Promise.all([
    getOpenSession(),
    supabase.from("children").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-slate-600">Victory Caloocan Kids Church check-in.</p>
      </div>

      <CurrentSessionCard session={openSession} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Registered children
          </p>
          <p className="mt-1 text-3xl font-bold">{activeChildren ?? 0}</p>
        </div>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 sm:col-span-2">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Live attendance
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Real-time table and Male / Female counts arrive in Phase 8.
          </p>
        </div>
      </div>

      <nav aria-label="Quick links" className="grid gap-4 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-400 hover:shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          >
            <p className="text-lg font-semibold">{link.label}</p>
            <p className="text-sm text-slate-600">{link.description}</p>
          </Link>
        ))}
      </nav>
    </div>
  );
}

import Link from "next/link";

import { ATTENDANCE_ROW_COLUMNS, type AttendanceRow } from "@/lib/attendance/types";
import { getOpenSession } from "@/lib/sessions/queries";
import { createClient } from "@/lib/supabase/server";

import { CurrentSessionCard } from "@/components/admin/current-session-card";
import { LiveAttendanceDashboard } from "@/components/admin/live-attendance-dashboard";
import { SessionWatcher } from "@/components/admin/session-watcher";

export const metadata = { title: "Admin Dashboard" };

const LIVE_ROW_LIMIT = 500;

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

  let rows: AttendanceRow[] = [];
  if (openSession) {
    const { data } = await supabase
      .from("attendance")
      .select(ATTENDANCE_ROW_COLUMNS)
      .eq("session_id", openSession.id)
      .order("checked_in_at", { ascending: false })
      .limit(LIVE_ROW_LIMIT);
    rows = data ?? [];
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-slate-600">Victory Caloocan Kids Church check-in.</p>
        </div>
        <p className="text-sm text-slate-600">
          Registered children: <span className="text-lg font-bold">{activeChildren ?? 0}</span>
        </p>
      </div>

      <CurrentSessionCard session={openSession} showCount={false} />

      {openSession ? (
        <LiveAttendanceDashboard
          key={openSession.id}
          sessionId={openSession.id}
          initialRows={rows}
        />
      ) : (
        <SessionWatcher />
      )}

      <nav aria-label="Quick links" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

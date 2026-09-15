import Link from "next/link";

import {
  HISTORY_PAGE_SIZE,
  parseHistoryFilters,
  queryAttendanceHistory,
} from "@/lib/attendance/history";
import { describeSession } from "@/lib/sessions/queries";
import { createClient } from "@/lib/supabase/server";

import { AttendanceTable } from "@/components/admin/attendance-table";
import { RemoveAttendanceButton } from "@/components/admin/remove-attendance-button";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Attendance History" };

const inputClass =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none";

export default async function AttendanceHistoryPage({
  searchParams,
}: PageProps<"/admin/attendance">) {
  const filters = parseHistoryFilters(await searchParams);
  const supabase = await createClient();

  const [{ rows, truncated }, { data: sessions }] = await Promise.all([
    queryAttendanceHistory(filters),
    supabase
      .from("church_sessions")
      .select("id, name, session_date, service_time, status")
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const hasFilters = Boolean(filters.sessionId || filters.from || filters.to || filters.q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance History</h1>
        <p className="mt-1 text-slate-600">
          Every check-in as it was recorded (snapshot values). Filter by session, date, or search.
        </p>
      </div>

      <form
        method="get"
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <label
            htmlFor="session"
            className="block text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
            Session
          </label>
          <select
            id="session"
            name="session"
            defaultValue={filters.sessionId ?? ""}
            className={`mt-1 ${inputClass}`}
          >
            <option value="">All sessions</option>
            {(sessions ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {describeSession(s)}
                {s.status === "open" ? " (open)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="from"
            className="block text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={filters.from ?? ""}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label
            htmlFor="to"
            className="block text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={filters.to ?? ""}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label
            htmlFor="q"
            className="block text-xs font-semibold tracking-wide text-slate-500 uppercase"
          >
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            placeholder="Child, guardian, or mobile"
            defaultValue={filters.q}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit">Apply filters</Button>
          {hasFilters ? (
            <Link
              href="/admin/attendance"
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Clear
            </Link>
          ) : null}
          <p className="ml-auto text-sm text-slate-500">
            {rows.length} record{rows.length === 1 ? "" : "s"}
            {truncated
              ? ` (first ${HISTORY_PAGE_SIZE} shown — narrow the filters to see more)`
              : ""}
          </p>
        </div>
      </form>

      <AttendanceTable
        rows={rows}
        showSession
        emptyMessage={
          hasFilters ? "No check-ins match these filters." : "No check-ins recorded yet."
        }
        renderActions={(row) => (
          <RemoveAttendanceButton attendanceId={row.id} childName={row.child_name_snapshot} />
        )}
      />
    </div>
  );
}

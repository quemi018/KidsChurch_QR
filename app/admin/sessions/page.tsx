import Link from "next/link";

import { describeSession, getOpenSession } from "@/lib/sessions/queries";
import { createClient } from "@/lib/supabase/server";
import { todayYmdString } from "@/lib/utils/age";
import { APP_TIMEZONE, formatDateTime } from "@/lib/utils/datetime";

import { CurrentSessionCard } from "@/components/admin/current-session-card";
import { OpenSessionForm } from "@/components/admin/open-session-form";

export const metadata = { title: "Kids Church Sessions" };

const PAGE_SIZE = 30;

/** "Sunday Kids Church" / "Saturday Kids Church" / "Kids Church" by day of week in Manila. */
function defaultSessionName(): string {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
  }).format(new Date());
  return weekday === "Saturday" || weekday === "Sunday" ? `${weekday} Kids Church` : "Kids Church";
}

export default async function SessionsPage() {
  const supabase = await createClient();
  const [openSession, { data: sessions }] = await Promise.all([
    getOpenSession(),
    supabase
      .from("church_sessions")
      .select(
        "id, name, session_date, service_time, status, opened_at, closed_at, attendance(count)",
      )
      .order("session_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE),
  ]);

  const rows = sessions ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Kids Church Sessions</h1>
        <p className="mt-1 text-slate-600">
          Attendance is recorded per session. Open one before the service, close it afterwards.
        </p>
      </div>

      <CurrentSessionCard session={openSession} />

      {!openSession ? (
        <section className="max-w-lg space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Open a session</h2>
          <OpenSessionForm defaultName={defaultSessionName()} defaultDate={todayYmdString()} />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Session history</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Opened</th>
                <th className="px-4 py-3">Closed</th>
                <th className="px-4 py-3 text-right">Checked in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No sessions yet.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/admin/sessions/${s.id}`}
                        className="text-blue-700 underline-offset-4 hover:underline"
                      >
                        {describeSession(s)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {s.status === "open" ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                          Open
                        </span>
                      ) : (
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {s.opened_at ? formatDateTime(s.opened_at) : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {s.closed_at ? formatDateTime(s.closed_at) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">{s.attendance[0]?.count ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

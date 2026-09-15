import Link from "next/link";
import { notFound } from "next/navigation";

import { describeSession } from "@/lib/sessions/queries";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/datetime";

import { SessionStatusControls } from "@/components/admin/session-status-controls";
import { FormAlert } from "@/components/ui/form-alert";

export const metadata = { title: "Session" };

export default async function SessionPage({
  params,
  searchParams,
}: PageProps<"/admin/sessions/[sessionId]">) {
  const { sessionId } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("church_sessions")
    .select(
      "id, name, session_date, service_time, status, opened_at, closed_at, created_at, opener:profiles!church_sessions_opened_by_fkey(full_name), closer:profiles!church_sessions_closed_by_fkey(full_name), attendance(count)",
    )
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) notFound();

  const status = session.status as "open" | "closed";
  const checkedInCount = session.attendance[0]?.count ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/sessions"
          className="text-sm text-blue-700 underline-offset-4 hover:underline"
        >
          ← Sessions
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{describeSession(session)}</h1>
      </div>

      {query.opened === "1" ? (
        <FormAlert tone="success" title="Session opened.">
          Scanning is now enabled.{" "}
          <Link href="/admin/scanner" className="font-semibold underline underline-offset-4">
            Go to Scanner
          </Link>
          .
        </FormAlert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Details</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[8rem_1fr]">
            <dt className="text-slate-500">Status</dt>
            <dd>
              {status === "open" ? (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                  Open
                </span>
              ) : (
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  Closed
                </span>
              )}
            </dd>
            <dt className="text-slate-500">Opened</dt>
            <dd>
              {session.opened_at ? formatDateTime(session.opened_at) : "—"}
              {session.opener?.full_name ? ` by ${session.opener.full_name}` : ""}
            </dd>
            <dt className="text-slate-500">Closed</dt>
            <dd>
              {session.closed_at ? formatDateTime(session.closed_at) : "—"}
              {session.closer?.full_name ? ` by ${session.closer.full_name}` : ""}
            </dd>
            <dt className="text-slate-500">Checked in</dt>
            <dd className="text-lg font-bold">{checkedInCount}</dd>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Session status</h2>
          <p className="mt-1 mb-4 text-sm text-slate-600">
            {status === "open"
              ? "Close the session after the service. Closed sessions no longer accept scans."
              : "This session is closed. Reopen it only if it was closed by mistake."}
          </p>
          <SessionStatusControls
            key={status}
            sessionId={session.id}
            sessionName={session.name}
            status={status}
            checkedInCount={checkedInCount}
          />
        </section>
      </div>

      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-6">
        <h2 className="text-lg font-semibold">Attendance</h2>
        <p className="mt-1 text-sm text-slate-500">
          The attendance list for this session appears here in Phase 9 (Attendance History).
        </p>
      </section>
    </div>
  );
}

import Link from "next/link";

import { describeSession, type OpenSession } from "@/lib/sessions/queries";

type CurrentSessionCardProps = {
  session: OpenSession | null;
  /** Show the Scanner / Sessions shortcuts. */
  showActions?: boolean;
  /** Hide the server-rendered count when a live attendance panel is shown below. */
  showCount?: boolean;
};

const linkClass =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4";

/** "CURRENT SESSION" summary used on the Admin dashboard, Sessions page and Scanner (spec §20, §31). */
export function CurrentSessionCard({
  session,
  showActions = true,
  showCount = true,
}: CurrentSessionCardProps) {
  if (!session) {
    return (
      <section className="rounded-xl border border-amber-300 bg-amber-50 p-6">
        <p className="text-xs font-semibold tracking-wide text-amber-800 uppercase">
          Current session
        </p>
        <h2 className="mt-1 text-xl font-bold text-amber-900">No Kids Church session is open</h2>
        <p className="mt-1 text-amber-900">Open a session before scanning attendance.</p>
        {showActions ? (
          <div className="mt-4">
            <Link
              href="/admin/sessions"
              className={`${linkClass} bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-300`}
            >
              Open a session
            </Link>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-green-300 bg-green-50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-green-800 uppercase">
            Current session
          </p>
          <h2 className="mt-1 text-xl font-bold text-green-900">{describeSession(session)}</h2>
          <p className="mt-1 text-green-900">
            Status: <span className="font-semibold">OPEN</span>
          </p>
        </div>
        {showCount ? (
          <div className="text-right">
            <p className="text-xs font-semibold tracking-wide text-green-800 uppercase">
              Checked in
            </p>
            <p className="text-4xl font-bold text-green-900">{session.checkedInCount}</p>
          </div>
        ) : null}
      </div>
      {showActions ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/scanner"
            className={`${linkClass} bg-green-700 text-white hover:bg-green-800 focus-visible:ring-green-300`}
          >
            Go to Scanner
          </Link>
          <Link
            href={`/admin/sessions/${session.id}`}
            className={`${linkClass} border-2 border-green-700 bg-white text-green-900 hover:bg-green-100 focus-visible:ring-green-300`}
          >
            Session details
          </Link>
        </div>
      ) : null}
    </section>
  );
}

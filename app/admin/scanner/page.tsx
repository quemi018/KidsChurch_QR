import { ATTENDANCE_ROW_COLUMNS, type AttendanceRow } from "@/lib/attendance/types";
import { getOpenSession } from "@/lib/sessions/queries";
import { createClient } from "@/lib/supabase/server";

import { CurrentSessionCard } from "@/components/admin/current-session-card";
import { ScannerConsole } from "@/components/admin/scanner-console";

export const metadata = { title: "Scanner" };

/** Only the current session's rows are loaded here — never full history (spec §48). */
const LIVE_ROW_LIMIT = 300;

export default async function ScannerPage() {
  const session = await getOpenSession();

  let rows: AttendanceRow[] = [];
  if (session) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("attendance")
      .select(ATTENDANCE_ROW_COLUMNS)
      .eq("session_id", session.id)
      .order("checked_in_at", { ascending: false })
      .limit(LIVE_ROW_LIMIT);
    rows = data ?? [];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scanner</h1>
      <CurrentSessionCard session={session} showActions={!session} showCount={false} />
      <ScannerConsole
        key={session?.id ?? "none"}
        sessionId={session?.id ?? null}
        initialRows={rows}
      />
    </div>
  );
}

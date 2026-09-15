import "server-only";

import { buildSearchTerms } from "@/lib/admin/search";
import { createClient } from "@/lib/supabase/server";
import { isValidYmd } from "@/lib/utils/age";

import { ATTENDANCE_ROW_COLUMNS, type AttendanceRow } from "./types";

export type HistoryFilters = {
  sessionId: string | null;
  /** YYYY-MM-DD, inclusive, on the Asia/Manila calendar. */
  from: string | null;
  to: string | null;
  q: string;
};

export type HistoryRow = AttendanceRow & {
  session: { id: string; name: string; session_date: string } | null;
};

export const HISTORY_PAGE_SIZE = 200;

/** Asia/Manila has no daylight saving; day boundaries are a fixed +08:00 offset. */
const MANILA_OFFSET = "+08:00";

export function parseHistoryFilters(params: Record<string, string | string[] | undefined>) {
  const str = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const sessionId = str("session");
  const from = str("from");
  const to = str("to");
  return {
    sessionId: /^[0-9a-f-]{36}$/.test(sessionId) ? sessionId : null,
    from: isValidYmd(from) ? from : null,
    to: isValidYmd(to) ? to : null,
    q: str("q").slice(0, 80),
  } satisfies HistoryFilters;
}

/** Admin-only (RLS): attendance history with snapshot values, newest first. */
export async function queryAttendanceHistory(filters: HistoryFilters): Promise<{
  rows: HistoryRow[];
  truncated: boolean;
}> {
  const supabase = await createClient();
  let query = supabase
    .from("attendance")
    .select(`${ATTENDANCE_ROW_COLUMNS}, session:church_sessions(id, name, session_date)`)
    .order("checked_in_at", { ascending: false })
    .limit(HISTORY_PAGE_SIZE + 1);

  if (filters.sessionId) query = query.eq("session_id", filters.sessionId);
  if (filters.from) query = query.gte("checked_in_at", `${filters.from}T00:00:00${MANILA_OFFSET}`);
  if (filters.to) query = query.lte("checked_in_at", `${filters.to}T23:59:59.999${MANILA_OFFSET}`);

  const search = buildSearchTerms(filters.q);
  const ors: string[] = [];
  if (search.namePattern) {
    ors.push(`child_name_snapshot.ilike.${search.namePattern}`);
    ors.push(`guardian_name_snapshot.ilike.${search.namePattern}`);
  }
  if (search.phonePattern) ors.push(`guardian_contact_snapshot.ilike.${search.phonePattern}`);
  if (ors.length) query = query.or(ors.join(","));

  const { data, error } = await query;
  if (error) {
    console.error("[attendance] history query failed", { code: error.code });
    return { rows: [], truncated: false };
  }
  const rows = (data ?? []) as HistoryRow[];
  return { rows: rows.slice(0, HISTORY_PAGE_SIZE), truncated: rows.length > HISTORY_PAGE_SIZE };
}

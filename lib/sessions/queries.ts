import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { formatCalendarDate } from "@/lib/utils/datetime";

export type OpenSession = {
  id: string;
  name: string;
  session_date: string;
  service_time: string | null;
  opened_at: string | null;
  checkedInCount: number;
};

/**
 * The single open Kids Church session, or null. The database allows at most
 * one (partial unique index), so `maybeSingle()` is safe. Cached per request.
 */
export const getOpenSession = cache(async (): Promise<OpenSession | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("church_sessions")
    .select("id, name, session_date, service_time, opened_at, attendance(count)")
    .eq("status", "open")
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    session_date: data.session_date,
    service_time: data.service_time,
    opened_at: data.opened_at,
    checkedInCount: data.attendance[0]?.count ?? 0,
  };
});

/** "09:00:00" (Postgres time) → "9:00 AM". */
export function formatServiceTime(value: string | null): string | null {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "Sunday Kids Church — 09/20/2026 — 9:00 AM" */
export function describeSession(session: {
  name: string;
  session_date: string;
  service_time: string | null;
}): string {
  const parts = [session.name, formatCalendarDate(session.session_date)];
  const time = formatServiceTime(session.service_time);
  if (time) parts.push(time);
  return parts.join(" — ");
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ATTENDANCE_ROW_COLUMNS, type AttendanceRow } from "@/lib/attendance/types";
import { createClient } from "@/lib/supabase/client";

export type LiveStatus = "connecting" | "live" | "reconnecting" | "error";

type Options = {
  sessionId: string | null;
  initialRows: AttendanceRow[];
  /** Upper bound on rows kept in memory; the live view never needs full history (spec §48). */
  limit?: number;
};

const DEFAULT_LIMIT = 500;

function toRow(record: Record<string, unknown>): AttendanceRow | null {
  if (typeof record.id !== "string" || typeof record.checked_in_at !== "string") return null;
  return {
    id: record.id,
    checked_in_at: record.checked_in_at,
    child_id: String(record.child_id ?? ""),
    child_name_snapshot: String(record.child_name_snapshot ?? ""),
    child_age_snapshot: Number(record.child_age_snapshot ?? 0),
    child_gender_snapshot: String(record.child_gender_snapshot ?? ""),
    guardian_name_snapshot: String(record.guardian_name_snapshot ?? ""),
    guardian_relationship_snapshot:
      typeof record.guardian_relationship_snapshot === "string"
        ? record.guardian_relationship_snapshot
        : null,
    guardian_contact_snapshot: String(record.guardian_contact_snapshot ?? ""),
  };
}

function sortNewestFirst(rows: AttendanceRow[]): AttendanceRow[] {
  return [...rows].sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at));
}

/**
 * Live attendance for one session (spec §21). Subscribes to database changes
 * on `attendance` filtered by session, keeps rows newest-first and de-duplicated,
 * reports connection status, and re-queries the table after every
 * (re)connection so a dropped connection cannot lose records. RLS applies to
 * the subscription, so only Admins ever receive rows.
 */
export function useLiveAttendance({ sessionId, initialRows, limit = DEFAULT_LIMIT }: Options) {
  const [rows, setRows] = useState<AttendanceRow[]>(() => sortNewestFirst(initialRows));
  const [status, setStatus] = useState<LiveStatus>(sessionId ? "connecting" : "live");
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const hasConnectedRef = useRef(false);

  const getClient = useCallback(() => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }, []);

  const mergeRow = useCallback(
    (row: AttendanceRow) => {
      setRows((current) => {
        if (current.some((r) => r.id === row.id)) return current;
        return sortNewestFirst([row, ...current]).slice(0, limit);
      });
    },
    [limit],
  );

  const removeRow = useCallback((id: string) => {
    setRows((current) => current.filter((r) => r.id !== id));
  }, []);

  /** Full re-query; used after reconnects and by the manual Refresh button. */
  const refresh = useCallback(async () => {
    if (!sessionId) return;
    const { data, error } = await getClient()
      .from("attendance")
      .select(ATTENDANCE_ROW_COLUMNS)
      .eq("session_id", sessionId)
      .order("checked_in_at", { ascending: false })
      .limit(limit);
    if (!error && data) setRows(data);
  }, [getClient, limit, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const supabase = getClient();
    hasConnectedRef.current = false;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const connect = async () => {
      // The browser client loads the session from cookies asynchronously. Joining
      // before the access token is attached would evaluate RLS as `anon` — the
      // subscription still reports SUBSCRIBED but never delivers a row.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.access_token) await supabase.realtime.setAuth(session.access_token);
      if (cancelled) return;

      channel = supabase
        .channel(`attendance:${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "attendance",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const row = toRow(payload.new as Record<string, unknown>);
            if (row) mergeRow(row);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "attendance",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const id = (payload.old as { id?: string }).id;
            if (id) removeRow(id);
          },
        )
        .subscribe((state) => {
          if (state === "SUBSCRIBED") {
            setStatus("live");
            // Anything inserted while we were disconnected is picked up here.
            if (hasConnectedRef.current) void refresh();
            hasConnectedRef.current = true;
          } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") {
            setStatus("reconnecting");
          } else if (state === "CLOSED") {
            setStatus((current) => (current === "live" ? "reconnecting" : current));
          }
        });
    };
    void connect();

    // Keep the Realtime token current across refreshes (a Kids Church session
    // outlives the one-hour access token).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) void supabase.realtime.setAuth(session.access_token);
    });

    // Coming back to a backgrounded tab: re-sync rather than trust the socket.
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [getClient, mergeRow, refresh, removeRow, sessionId]);

  return { rows, status, mergeRow, refresh };
}

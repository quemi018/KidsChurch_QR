import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

export type AuditAction =
  | "admin_created"
  | "admin_activated"
  | "admin_deactivated"
  | "station_activated"
  | "station_deactivated"
  | "child_archived"
  | "child_reactivated"
  | "session_opened"
  | "session_closed"
  | "session_reopened"
  | "attendance_removed";

type AuditEntry = {
  actorId: string | null;
  action: AuditAction;
  entityType: "profile" | "registration_station" | "child" | "church_session" | "attendance";
  entityId?: string | null;
  metadata?: Record<string, Json | undefined>;
};

/**
 * Appends an audit row. Never throws: an audit failure must not undo the
 * action it describes. Works with an Admin's user-scoped client (RLS requires
 * actor_id = auth.uid()) or the service-role client.
 */
export async function logAudit(supabase: SupabaseClient<Database>, entry: AuditEntry) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ? (entry.metadata as Json) : null,
  });
  if (error) {
    console.error("[audit] failed to write audit log", { action: entry.action, code: error.code });
  }
}

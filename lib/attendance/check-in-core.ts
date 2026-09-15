import type { SupabaseClient } from "@supabase/supabase-js";

import { parseQrPayload } from "@/lib/qr/payload";
import { calculateAgeOn } from "@/lib/utils/age";
import type { Database } from "@/types/database";

import type { CheckInResult } from "./types";

/** Postgres unique_violation: UNIQUE(session_id, child_id) — a concurrent duplicate scan. */
const UNIQUE_VIOLATION = "23505";

function relationshipLabel(relationship: string | null, other: string | null): string | null {
  if (!relationship) return null;
  return relationship === "Other" && other ? `Other (${other})` : relationship;
}

export type CheckInDeps = {
  /** A client authenticated as the Admin performing the scan (RLS applies). */
  supabase: SupabaseClient<Database>;
  adminUserId: string;
};

/**
 * Check-in pipeline (spec §17, §26), independent of Next.js so it can be
 * tested directly. Runs under the Admin's RLS:
 *
 *  1. payload is vckc:<token>           -> invalid_qr
 *  2. child exists for the token        -> unknown_qr
 *  3. child is active                   -> inactive_child
 *  4. guardian relationship exists      -> unknown_qr
 *  5. a session is open                 -> no_open_session
 *  6. not already checked in            -> already_checked_in
 *  7. insert with age-as-of-session-date + snapshots; the UNIQUE constraint is
 *     the final defense if two scans race (reported as already_checked_in)
 *
 * Never throws for business outcomes. Tokens are never logged.
 */
export async function performCheckIn(
  { supabase, adminUserId }: CheckInDeps,
  qrPayload: string,
): Promise<CheckInResult> {
  const token = parseQrPayload(qrPayload);
  if (!token) return { status: "invalid_qr" };

  const { data: child, error: childError } = await supabase
    .from("children")
    .select(
      "id, full_name, gender, birthday, is_active, guardian:profiles!children_guardian_id_fkey(id, full_name, phone, guardian_relationship, guardian_relationship_other)",
    )
    .eq("qr_token", token)
    .maybeSingle();

  if (childError) {
    console.error("[check-in] child lookup failed", { code: childError.code });
    return { status: "error" };
  }
  if (!child) return { status: "unknown_qr" };
  if (!child.is_active) return { status: "inactive_child" };
  if (!child.guardian) return { status: "unknown_qr" };

  const { data: session } = await supabase
    .from("church_sessions")
    .select("id, session_date")
    .eq("status", "open")
    .maybeSingle();
  if (!session) return { status: "no_open_session" };

  const childSummary = {
    name: child.full_name,
    age: calculateAgeOn(child.birthday, session.session_date),
    gender: child.gender,
  };

  const { data: existing } = await supabase
    .from("attendance")
    .select("checked_in_at")
    .eq("session_id", session.id)
    .eq("child_id", child.id)
    .maybeSingle();
  if (existing) {
    return {
      status: "already_checked_in",
      child: childSummary,
      checkedInAt: existing.checked_in_at,
    };
  }

  const relationship = relationshipLabel(
    child.guardian.guardian_relationship,
    child.guardian.guardian_relationship_other,
  );

  const { data: inserted, error: insertError } = await supabase
    .from("attendance")
    .insert({
      session_id: session.id,
      child_id: child.id,
      guardian_id: child.guardian.id,
      checked_in_by: adminUserId,
      child_name_snapshot: child.full_name,
      child_gender_snapshot: child.gender,
      child_age_snapshot: childSummary.age,
      guardian_name_snapshot: child.guardian.full_name,
      guardian_relationship_snapshot: relationship,
      guardian_contact_snapshot: child.guardian.phone ?? "",
    })
    .select("id, checked_in_at")
    .single();

  if (insertError || !inserted) {
    if (insertError?.code === UNIQUE_VIOLATION) {
      // Lost a race with a duplicate scan: report the original check-in time.
      const { data: winner } = await supabase
        .from("attendance")
        .select("checked_in_at")
        .eq("session_id", session.id)
        .eq("child_id", child.id)
        .maybeSingle();
      return {
        status: "already_checked_in",
        child: childSummary,
        checkedInAt: winner?.checked_in_at ?? new Date().toISOString(),
      };
    }
    console.error("[check-in] insert failed", { code: insertError?.code });
    return { status: "error" };
  }

  return {
    status: "checked_in",
    attendanceId: inserted.id,
    childId: child.id,
    child: childSummary,
    guardian: {
      name: child.guardian.full_name,
      relationship,
      contact: child.guardian.phone ?? "",
    },
    checkedInAt: inserted.checked_in_at,
  };
}

"use server";

import { revalidatePath } from "next/cache";

import { getActiveUserWithRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/utils/audit";

/**
 * Admin-only correction: removes an attendance record that should not exist
 * (e.g. the wrong child was scanned). Snapshots are never edited; the row is
 * deleted and the action is audit-logged with the snapshot values. Live
 * dashboards drop the row through the Realtime DELETE event.
 */
export async function removeAttendanceAction(formData: FormData): Promise<void> {
  const actor = await getActiveUserWithRole("admin");
  if (!actor) return;
  const attendanceId = formData.get("attendanceId");
  if (typeof attendanceId !== "string" || !attendanceId) return;

  const supabase = await createClient();
  const { data: removed, error } = await supabase
    .from("attendance")
    .delete()
    .eq("id", attendanceId)
    .select("id, session_id, child_id, child_name_snapshot, checked_in_at")
    .maybeSingle();

  if (error || !removed) {
    console.error("[attendance] remove failed", { code: error?.code });
    return;
  }

  await logAudit(supabase, {
    actorId: actor.userId,
    action: "attendance_removed",
    entityType: "attendance",
    entityId: removed.id,
    metadata: {
      session_id: removed.session_id,
      child_id: removed.child_id,
      child_name: removed.child_name_snapshot,
      checked_in_at: removed.checked_in_at,
    },
  });

  revalidatePath("/admin/attendance");
  revalidatePath(`/admin/sessions/${removed.session_id}`);
  revalidatePath("/admin/sessions");
}

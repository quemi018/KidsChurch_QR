"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getActiveUserWithRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/utils/audit";
import { formValues, type FormState } from "@/lib/utils/form-state";
import { fieldErrors } from "@/lib/validation/auth";
import { openSessionSchema } from "@/lib/validation/sessions";

/** Postgres unique_violation — here it can only be the single-open-session index. */
const UNIQUE_VIOLATION = "23505";

const SESSION_PATHS = ["/admin", "/admin/sessions", "/admin/scanner"];

function revalidateSessionPaths(sessionId?: string) {
  SESSION_PATHS.forEach((path) => revalidatePath(path));
  if (sessionId) revalidatePath(`/admin/sessions/${sessionId}`);
}

/** Creates and opens a session (spec §15). Fails cleanly if one is already open. */
export async function openSessionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await getActiveUserWithRole("admin");
  if (!actor) return { status: "error", message: "Admin sign-in required." };

  const values = formValues(formData, ["name", "sessionDate", "serviceTime"]);
  const parsed = openSessionSchema.safeParse({
    name: formData.get("name"),
    sessionDate: formData.get("sessionDate"),
    serviceTime: formData.get("serviceTime") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("church_sessions")
    .insert({
      name: parsed.data.name,
      session_date: parsed.data.sessionDate,
      service_time: parsed.data.serviceTime,
      status: "open",
      opened_by: actor.userId,
      opened_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !session) {
    if (error?.code === UNIQUE_VIOLATION) {
      return {
        status: "error",
        message: "A session is already open. Close it before opening another one.",
        values,
      };
    }
    console.error("[sessions] open failed", { code: error?.code });
    return { status: "error", message: "Could not open the session. Please try again.", values };
  }

  await logAudit(supabase, {
    actorId: actor.userId,
    action: "session_opened",
    entityType: "church_session",
    entityId: session.id,
    metadata: { name: parsed.data.name, session_date: parsed.data.sessionDate },
  });

  revalidateSessionPaths(session.id);
  redirect(`/admin/sessions/${session.id}?opened=1`);
}

/** Closes a session: no further scans can be assigned to it (spec §15). */
export async function closeSessionAction(formData: FormData): Promise<void> {
  const actor = await getActiveUserWithRole("admin");
  if (!actor) return;
  const sessionId = formData.get("sessionId");
  if (typeof sessionId !== "string" || !sessionId) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("church_sessions")
    .update({ status: "closed", closed_by: actor.userId, closed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("status", "open")
    .select("id, name")
    .maybeSingle();

  if (error || !data) {
    console.error("[sessions] close failed", { code: error?.code });
    return;
  }

  await logAudit(supabase, {
    actorId: actor.userId,
    action: "session_closed",
    entityType: "church_session",
    entityId: sessionId,
    metadata: { name: data.name },
  });
  revalidateSessionPaths(sessionId);
}

/**
 * Reopens a closed session (e.g. closed by mistake mid-service). Rejected by
 * the database if another session is currently open.
 */
export async function reopenSessionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await getActiveUserWithRole("admin");
  if (!actor) return { status: "error", message: "Admin sign-in required." };
  const sessionId = formData.get("sessionId");
  if (typeof sessionId !== "string" || !sessionId)
    return { status: "error", message: "Missing session." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("church_sessions")
    .update({ status: "open", closed_by: null, closed_at: null })
    .eq("id", sessionId)
    .eq("status", "closed")
    .select("id, name")
    .maybeSingle();

  if (error || !data) {
    if (error?.code === UNIQUE_VIOLATION) {
      return {
        status: "error",
        message: "Another session is currently open. Close it first.",
      };
    }
    console.error("[sessions] reopen failed", { code: error?.code });
    return { status: "error", message: "Could not reopen the session." };
  }

  await logAudit(supabase, {
    actorId: actor.userId,
    action: "session_reopened",
    entityType: "church_session",
    entityId: sessionId,
    metadata: { name: data.name },
  });
  revalidateSessionPaths(sessionId);
  return { status: "success", message: "Session reopened." };
}

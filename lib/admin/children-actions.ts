"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getActiveUserWithRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/utils/audit";
import { formValues, type FormState } from "@/lib/utils/form-state";
import { fieldErrors } from "@/lib/validation/auth";
import { childSchema } from "@/lib/validation/children";

function childPaths(childId: string): string[] {
  return [`/admin/children/${childId}`, "/admin/children", "/admin/guardians", "/member"];
}

/**
 * Admin-only soft delete (spec §12). The database trigger rejects this for
 * non-admins, and attendance history is preserved (no physical delete).
 */
export async function archiveChildAction(formData: FormData): Promise<void> {
  const actor = await getActiveUserWithRole("admin");
  if (!actor) return;
  const childId = formData.get("childId");
  if (typeof childId !== "string" || !childId) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .update({ is_active: false, archived_at: new Date().toISOString(), archived_by: actor.userId })
    .eq("id", childId)
    .eq("is_active", true)
    .select("id, full_name")
    .maybeSingle();

  if (error || !data) {
    console.error("[admin/children] archive failed", { code: error?.code });
    return;
  }

  await logAudit(supabase, {
    actorId: actor.userId,
    action: "child_archived",
    entityType: "child",
    entityId: childId,
    metadata: { full_name: data.full_name },
  });
  childPaths(childId).forEach((path) => revalidatePath(path));
}

export async function reactivateChildAction(formData: FormData): Promise<void> {
  const actor = await getActiveUserWithRole("admin");
  if (!actor) return;
  const childId = formData.get("childId");
  if (typeof childId !== "string" || !childId) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .update({ is_active: true, archived_at: null, archived_by: null })
    .eq("id", childId)
    .eq("is_active", false)
    .select("id, full_name")
    .maybeSingle();

  if (error || !data) {
    console.error("[admin/children] reactivate failed", { code: error?.code });
    return;
  }

  await logAudit(supabase, {
    actorId: actor.userId,
    action: "child_reactivated",
    entityType: "child",
    entityId: childId,
    metadata: { full_name: data.full_name },
  });
  childPaths(childId).forEach((path) => revalidatePath(path));
}

/** Admin correction of a child's details. qr_token is never touched. */
export async function adminUpdateChildAction(
  childId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await getActiveUserWithRole("admin");
  if (!actor) return { status: "error", message: "Admin sign-in required." };

  const values = formValues(formData, ["fullName", "gender", "birthday"]);
  const parsed = childSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children")
    .update({
      full_name: parsed.data.fullName,
      gender: parsed.data.gender,
      birthday: parsed.data.birthday,
    })
    .eq("id", childId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("[admin/children] update failed", { code: error?.code });
    return { status: "error", message: "Could not save the changes.", values };
  }

  childPaths(childId).forEach((path) => revalidatePath(path));
  redirect(`/admin/children/${childId}?updated=1`);
}

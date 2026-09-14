"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/utils/audit";
import { formValues, type FormState } from "@/lib/utils/form-state";
import { createAdminSchema, fieldErrors } from "@/lib/validation/auth";

import { getActiveUserWithRole } from "./session";

const ADMIN_USERS_PATH = "/admin/admin-users";

/**
 * Admin-only: create another Admin account.
 * `role` is passed through app_metadata, which only the service-role API can
 * set — the profiles trigger reads it from there and nowhere else.
 */
export async function createAdminAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await getActiveUserWithRole("admin");
  if (!actor) return { status: "error", message: "Admin sign-in required." };

  const values = formValues(formData, ["fullName", "phone"]);
  const parsed = createAdminSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    phone: parsed.data.phone,
    password: parsed.data.password,
    phone_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { full_name: parsed.data.fullName },
  });

  if (error || !data.user) {
    if (error?.code === "phone_exists") {
      return {
        status: "error",
        fieldErrors: { phone: "This mobile number already has an account." },
        values,
      };
    }
    console.error("[admin-users] createUser failed", { code: error?.code });
    return { status: "error", message: "Could not create the Admin account.", values };
  }

  const supabase = await createClient();
  await logAudit(supabase, {
    actorId: actor.userId,
    action: "admin_created",
    entityType: "profile",
    entityId: data.user.id,
    metadata: { full_name: parsed.data.fullName },
  });

  revalidatePath(ADMIN_USERS_PATH);
  return { status: "success", message: `Admin account created for ${parsed.data.fullName}.` };
}

/** Admin-only: activate/deactivate another Admin. Never self; never the last active Admin. */
export async function setAdminActiveAction(formData: FormData): Promise<void> {
  const actor = await getActiveUserWithRole("admin");
  if (!actor) return;

  const profileId = formData.get("profileId");
  const makeActive = formData.get("active") === "true";
  if (typeof profileId !== "string" || !profileId || profileId === actor.userId) return;

  const supabase = await createClient();

  if (!makeActive) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("is_active", true);
    if ((count ?? 0) <= 1) return; // keep at least one active Admin
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: makeActive })
    .eq("id", profileId)
    .eq("role", "admin");

  if (error) {
    console.error("[admin-users] set active failed", { code: error.code });
    return;
  }

  await logAudit(supabase, {
    actorId: actor.userId,
    action: makeActive ? "admin_activated" : "admin_deactivated",
    entityType: "profile",
    entityId: profileId,
  });

  revalidatePath(ADMIN_USERS_PATH);
}

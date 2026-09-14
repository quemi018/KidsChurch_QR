"use server";

import { createClient as createBareClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getActiveUserWithRole } from "@/lib/auth/session";
import { isStationSatisfied } from "@/lib/auth/station";
import { STATION_REQUIRED_PATH } from "@/lib/auth/station-policy";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { formValues, type FormState } from "@/lib/utils/form-state";
import { fieldErrors } from "@/lib/validation/auth";
import { childSchema } from "@/lib/validation/children";
import { changePhoneSchema, guardianProfileSchema } from "@/lib/validation/profile";

const MEMBER_PATH = "/member";

/** Every member write requires an active member on an activated station. */
async function requireMemberOnStation() {
  if (!(await isStationSatisfied())) redirect(STATION_REQUIRED_PATH);
  const user = await getActiveUserWithRole("member");
  if (!user) redirect("/login");
  return user;
}

export async function updateGuardianProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireMemberOnStation();

  const values = formValues(formData, [
    "fullName",
    "guardianRelationship",
    "guardianRelationshipOther",
    "homeCity",
    "email",
  ]);
  const parsed = guardianProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    guardianRelationship: formData.get("guardianRelationship"),
    guardianRelationshipOther: formData.get("guardianRelationshipOther") ?? "",
    homeCity: formData.get("homeCity"),
    email: formData.get("email") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName,
      guardian_relationship: input.guardianRelationship,
      guardian_relationship_other:
        input.guardianRelationship === "Other" ? input.guardianRelationshipOther || null : null,
      home_city: input.homeCity,
      email: input.email,
    })
    .eq("id", user.userId);

  if (error) {
    console.error("[profile] update failed", { code: error.code });
    return { status: "error", message: "Could not save your changes. Please try again.", values };
  }

  revalidatePath(MEMBER_PATH, "layout");
  return { status: "success", message: "Your information has been saved." };
}

/**
 * Changes the login mobile number. Requires the current password (the number
 * is the account identifier), then updates Auth via the service-role API; the
 * database trigger mirrors it into profiles.phone. No SMS is sent (spec §8).
 */
export async function changePhoneAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireMemberOnStation();

  const values = formValues(formData, ["phone"]);
  const parsed = changePhoneSchema.safeParse({
    phone: formData.get("phone"),
    currentPassword: formData.get("currentPassword"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }
  if (parsed.data.phone === user.profile.phone) {
    return { status: "error", fieldErrors: { phone: "That is already your number." }, values };
  }

  // Verify the password with a throwaway client so the station's cookies are untouched.
  const { url, publishableKey } = getPublicSupabaseEnv();
  const verifier = createBareClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    phone: user.profile.phone ?? "",
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return {
      status: "error",
      fieldErrors: { currentPassword: "Incorrect password." },
      values,
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.userId, {
    phone: parsed.data.phone,
    phone_confirm: true,
  });
  if (error) {
    if (error.code === "phone_exists") {
      return {
        status: "error",
        fieldErrors: { phone: "This mobile number is already used by another account." },
        values,
      };
    }
    console.error("[profile] phone change failed", { code: error.code });
    return { status: "error", message: "Could not change the mobile number.", values };
  }

  revalidatePath(MEMBER_PATH, "layout");
  return { status: "success", message: "Mobile number updated. Use it the next time you log in." };
}

export async function createChildAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireMemberOnStation();

  const values = formValues(formData, ["fullName", "gender", "birthday"]);
  const parsed = childSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  // Inserted as the guardian: RLS enforces guardian_id = auth.uid() and the
  // database generates the permanent qr_token.
  const supabase = await createClient();
  const { data: child, error } = await supabase
    .from("children")
    .insert({
      guardian_id: user.userId,
      full_name: parsed.data.fullName,
      gender: parsed.data.gender,
      birthday: parsed.data.birthday,
    })
    .select("id")
    .single();

  if (error || !child) {
    console.error("[children] insert failed", { code: error?.code });
    return { status: "error", message: "Could not add the child. Please try again.", values };
  }

  // Phase 5: send the QR email here when the guardian has an email.

  revalidatePath(MEMBER_PATH, "layout");
  redirect(`/member/children/${child.id}?created=1`);
}

export async function updateChildAction(
  childId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMemberOnStation();

  const values = formValues(formData, ["fullName", "gender", "birthday"]);
  const parsed = childSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  // RLS limits this to the guardian's own active children; qr_token is never touched.
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("children")
    .update({
      full_name: parsed.data.fullName,
      gender: parsed.data.gender,
      birthday: parsed.data.birthday,
    })
    .eq("id", childId)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    console.error("[children] update failed", { code: error?.code });
    return {
      status: "error",
      message: "Could not save the changes. The record may be inactive — ask an Admin.",
      values,
    };
  }

  revalidatePath(MEMBER_PATH, "layout");
  redirect(`/member/children/${childId}?updated=1`);
}

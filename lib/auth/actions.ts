"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, guardianRegistrationSchema, loginSchema } from "@/lib/validation/auth";
import { formValues, type FormState } from "@/lib/utils/form-state";
import type { UserRole } from "@/types/app";

import { homePathFor, safeNextPath } from "./session";
import { isStationSatisfied } from "./station";
import { STATION_REQUIRED_PATH } from "./station-policy";

const LOGIN_FIELDS = ["phone", "next"] as const;
const REGISTER_FIELDS = [
  "fullName",
  "guardianRelationship",
  "guardianRelationshipOther",
  "phone",
  "homeCity",
  "email",
] as const;

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, LOGIN_FIELDS);
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: parsed.data.phone,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    // Same message for unknown number and wrong password (no account enumeration).
    return { status: "error", message: "Incorrect mobile number or password.", values };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return { status: "error", message: "Account is not set up. Please ask an Admin.", values };
  }
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "This account has been deactivated. Please ask an Admin for assistance.",
      values,
    };
  }

  const role = profile.role as UserRole;
  const next = safeNextPath(parsed.data.next);
  // Only honour `next` when it points inside the user's own area.
  const destination = next && next.startsWith(homePathFor(role)) ? next : homePathFor(role);
  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Creates a guardian account on the Registration Station.
 *
 * Public Supabase sign-up is disabled for this project; accounts are created
 * here with the service-role admin API so the station gate cannot be bypassed
 * by calling Supabase directly. Phase 4 extends this flow with the children
 * section of the registration wizard.
 */
export async function registerGuardianAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await isStationSatisfied())) redirect(STATION_REQUIRED_PATH);

  const values = formValues(formData, REGISTER_FIELDS);
  const parsed = guardianRegistrationSchema.safeParse({
    fullName: formData.get("fullName"),
    guardianRelationship: formData.get("guardianRelationship"),
    guardianRelationshipOther: formData.get("guardianRelationshipOther") ?? "",
    phone: formData.get("phone"),
    homeCity: formData.get("homeCity"),
    email: formData.get("email") ?? "",
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values };
  }
  const input = parsed.data;

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    phone: input.phone,
    password: input.password,
    phone_confirm: true, // No SMS OTP in Version 1 (spec §8).
    user_metadata: {
      full_name: input.fullName,
      guardian_relationship: input.guardianRelationship,
      guardian_relationship_other:
        input.guardianRelationship === "Other" ? (input.guardianRelationshipOther ?? "") : "",
      home_city: input.homeCity,
      email: input.email ?? "",
    },
  });

  if (createError) {
    if (createError.code === "phone_exists") {
      return {
        status: "error",
        fieldErrors: { phone: "This mobile number is already registered. Please log in instead." },
        values,
      };
    }
    if (createError.code === "weak_password") {
      return { status: "error", fieldErrors: { password: createError.message }, values };
    }
    console.error("[register] createUser failed", { code: createError.code });
    return {
      status: "error",
      message: "We could not create the account. Please try again or ask an Admin.",
      values,
    };
  }

  // Sign the new guardian in on this station so they land on their dashboard.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    phone: input.phone,
    password: input.password,
  });
  if (signInError) {
    console.error("[register] post-registration sign-in failed", { code: signInError.code });
    redirect("/login?registered=1");
  }

  redirect("/member");
}

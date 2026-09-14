"use server";

import { redirect } from "next/navigation";

import { sendQrEmailsForChildren } from "@/lib/email/qr-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  fieldErrors,
  guardianRegistrationSchema,
  loginSchema,
  withPasswordMismatch,
} from "@/lib/validation/auth";
import { formValues, type FormState } from "@/lib/utils/form-state";
import { parseChildrenFromForm } from "@/lib/validation/children";
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
 * Creates a guardian account with one or more children on the Registration
 * Station (spec §9, §43).
 *
 * Public Supabase sign-up is disabled for this project; accounts are created
 * here with the service-role admin API so the station gate cannot be bypassed
 * by calling Supabase directly. Everything is validated before any write. If
 * the children insert fails after the Auth user exists, the user is deleted
 * again so no half-registered account remains.
 */
export async function registerGuardianAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await isStationSatisfied())) redirect(STATION_REQUIRED_PATH);

  const childrenResult = parseChildrenFromForm(formData);
  const values = { ...formValues(formData, REGISTER_FIELDS), ...childrenResult.values };

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

  const errors = {
    ...(parsed.success ? {} : withPasswordMismatch(fieldErrors(parsed.error), formData)),
    ...childrenResult.fieldErrors,
  };
  if (
    childrenResult.children.length === 0 &&
    Object.keys(childrenResult.fieldErrors).length === 0
  ) {
    errors.children = "Add at least one child.";
  }
  if (!parsed.success || Object.keys(errors).length > 0) {
    return { status: "error", fieldErrors: errors, values };
  }
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
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

  if (createError || !created.user) {
    if (createError?.code === "phone_exists") {
      return {
        status: "error",
        fieldErrors: { phone: "This mobile number is already registered. Please log in instead." },
        values,
      };
    }
    if (createError?.code === "weak_password") {
      return { status: "error", fieldErrors: { password: createError.message }, values };
    }
    console.error("[register] createUser failed", { code: createError?.code });
    return {
      status: "error",
      message: "We could not create the account. Please try again or ask an Admin.",
      values,
    };
  }

  // qr_token is generated by the database default (secure random, unique).
  const { data: insertedChildren, error: childrenError } = await admin
    .from("children")
    .insert(
      childrenResult.children.map((child) => ({
        guardian_id: created.user.id,
        full_name: child.fullName,
        gender: child.gender,
        birthday: child.birthday,
      })),
    )
    .select("id");

  if (childrenError || !insertedChildren) {
    console.error("[register] children insert failed; rolling back user", {
      code: childrenError?.code,
    });
    await admin.auth.admin.deleteUser(created.user.id);
    return {
      status: "error",
      message: "We could not save the children. Please check the details and try again.",
      values,
    };
  }

  // QR delivery (spec §13–14): one email per child when an email exists.
  // Failure here never fails registration; the dashboard shows what happened.
  let emailStatus: "sent" | "failed" | "none" = "none";
  if (input.email) {
    const outcomes = await sendQrEmailsForChildren(insertedChildren.map((c) => c.id));
    emailStatus = outcomes.every((o) => o.status === "sent") ? "sent" : "failed";
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

  redirect(`/member?welcome=1&email=${emailStatus}`);
}

"use client";

import { useActionState } from "react";

import { createAdminAction } from "@/lib/auth/admin-actions";
import { idleFormState } from "@/lib/utils/form-state";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation/auth";

import { InputField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateAdminForm() {
  const [state, action] = useActionState(createAdminAction, idleFormState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}
      {state.status === "success" ? <FormAlert tone="success">{state.message}</FormAlert> : null}

      <InputField
        id="fullName"
        label="Full name"
        autoComplete="off"
        defaultValue={values.fullName}
        error={errors.fullName}
        required
      />
      <InputField
        id="phone"
        label="Mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        placeholder="0917 123 4567"
        defaultValue={values.phone}
        error={errors.phone}
        required
      />
      <InputField
        id="password"
        label="Temporary password"
        type="password"
        autoComplete="new-password"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters. Share it privately with the new Admin.`}
        error={errors.password}
        required
      />
      <InputField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword}
        required
      />
      <SubmitButton pendingLabel="Creating…">Create Admin</SubmitButton>
    </form>
  );
}

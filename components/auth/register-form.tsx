"use client";

import { useActionState, useState } from "react";

import { registerGuardianAction } from "@/lib/auth/actions";
import { idleFormState } from "@/lib/utils/form-state";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation/auth";
import { GUARDIAN_RELATIONSHIPS } from "@/types/app";

import { InputField, SelectField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";

const relationshipOptions = GUARDIAN_RELATIONSHIPS.map((value) => ({ value, label: value }));

/**
 * Guardian account form (spec §9). The Children section of the registration
 * wizard is added in Phase 4.
 */
export function RegisterForm() {
  const [state, action] = useActionState(registerGuardianAction, idleFormState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};
  const [relationship, setRelationship] = useState(values.guardianRelationship ?? "");

  return (
    <form action={action} className="space-y-8" noValidate>
      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}

      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold">Parent / Guardian</legend>

        <InputField
          id="fullName"
          label="Full name"
          autoComplete="name"
          defaultValue={values.fullName}
          error={errors.fullName}
          required
        />
        <SelectField
          id="guardianRelationship"
          label="Relationship to the child"
          options={relationshipOptions}
          placeholder="Select…"
          value={relationship}
          onChange={(event) => setRelationship(event.target.value)}
          error={errors.guardianRelationship}
          required
        />
        {relationship === "Other" ? (
          <InputField
            id="guardianRelationshipOther"
            label="Please specify (optional)"
            defaultValue={values.guardianRelationshipOther}
            error={errors.guardianRelationshipOther}
          />
        ) : null}
        <InputField
          id="phone"
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0917 123 4567"
          hint="You will use this number to log in."
          defaultValue={values.phone}
          error={errors.phone}
          required
        />
        <InputField
          id="homeCity"
          label="Home city"
          autoComplete="address-level2"
          defaultValue={values.homeCity}
          error={errors.homeCity}
          required
        />
        <InputField
          id="email"
          label="Email address (optional)"
          type="email"
          inputMode="email"
          autoComplete="email"
          hint="If provided, each child's QR code will also be sent here."
          defaultValue={values.email}
          error={errors.email}
        />
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold">Password</legend>
        <InputField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
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
      </fieldset>

      <SubmitButton size="lg" className="w-full" pendingLabel="Creating account…">
        Create Account
      </SubmitButton>
    </form>
  );
}

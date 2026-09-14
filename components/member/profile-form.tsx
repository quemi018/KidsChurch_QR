"use client";

import { useActionState, useState } from "react";

import { updateGuardianProfileAction } from "@/lib/member/actions";
import { idleFormState } from "@/lib/utils/form-state";
import { GUARDIAN_RELATIONSHIPS } from "@/types/app";

import { InputField, SelectField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";

const relationshipOptions = GUARDIAN_RELATIONSHIPS.map((value) => ({ value, label: value }));

type ProfileFormProps = {
  initial: {
    fullName: string;
    guardianRelationship: string;
    guardianRelationshipOther: string;
    homeCity: string;
    email: string;
  };
};

/** Guardian-editable fields (spec §11). Mobile number is changed separately. */
export function ProfileForm({ initial }: ProfileFormProps) {
  const [state, action] = useActionState(updateGuardianProfileAction, idleFormState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : initial;

  const [showOther, setShowOther] = useState(initial.guardianRelationship === "Other");
  const [formKey, setFormKey] = useState(0);
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    if (state.status === "error") {
      setShowOther(state.values?.guardianRelationship === "Other");
      setFormKey((key) => key + 1);
    }
  }

  return (
    <form key={formKey} action={action} className="space-y-5" noValidate>
      {state.status === "error" && state.message ? (
        <FormAlert tone="error">{state.message}</FormAlert>
      ) : null}
      {state.status === "success" ? <FormAlert tone="success">{state.message}</FormAlert> : null}

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
        defaultValue={values.guardianRelationship ?? ""}
        onChange={(event) => setShowOther(event.target.value === "Other")}
        error={errors.guardianRelationship}
        required
      />
      {showOther ? (
        <InputField
          id="guardianRelationshipOther"
          label="Please specify (optional)"
          defaultValue={values.guardianRelationshipOther}
          error={errors.guardianRelationshipOther}
        />
      ) : null}
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
        hint="Used to send your children's QR codes. Leave blank if you have no email."
        defaultValue={values.email}
        error={errors.email}
      />

      <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
    </form>
  );
}

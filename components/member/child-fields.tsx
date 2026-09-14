import { GENDERS } from "@/types/app";

import { InputField, SelectField } from "@/components/ui/field";

const genderOptions = GENDERS.map((value) => ({ value, label: value }));

type ChildFieldsProps = {
  /** Input names/ids, e.g. { fullName: "child_0_fullName", ... }. */
  names: { fullName: string; gender: string; birthday: string };
  values?: { fullName?: string; gender?: string; birthday?: string };
  errors?: { fullName?: string; gender?: string; birthday?: string };
  /** Today's date (YYYY-MM-DD) in Asia/Manila, used as the date picker maximum. */
  maxBirthday: string;
};

/** Name / gender / birthday inputs for one child. Age is never entered by hand (spec §9). */
export function ChildFields({ names, values = {}, errors = {}, maxBirthday }: ChildFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <InputField
          id={names.fullName}
          label="Child's full name"
          autoComplete="off"
          defaultValue={values.fullName}
          error={errors.fullName}
          required
        />
      </div>
      <SelectField
        id={names.gender}
        label="Gender"
        options={genderOptions}
        placeholder="Select…"
        defaultValue={values.gender ?? ""}
        error={errors.gender}
        required
      />
      <InputField
        id={names.birthday}
        label="Birthday"
        type="date"
        max={maxBirthday}
        min="1900-01-01"
        defaultValue={values.birthday}
        error={errors.birthday}
        hint="Age is calculated automatically."
        required
      />
    </div>
  );
}

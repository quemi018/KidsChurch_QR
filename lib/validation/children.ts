import { z } from "zod";

import { GENDERS } from "@/types/app";

import { isValidYmd, todayYmdString } from "@/lib/utils/age";

/** Oldest plausible birthday we accept; guards against typos like 1025-01-01. */
const EARLIEST_BIRTHDAY = "1900-01-01";

export const childSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Child's full name is required.")
    .max(120, "Child's name is too long."),
  gender: z.enum(GENDERS, { error: "Select the child's gender." }),
  birthday: z
    .string()
    .trim()
    .min(1, "Birthday is required.")
    .refine(isValidYmd, "Enter a valid date.")
    .refine((value) => value <= todayYmdString(), "Birthday cannot be in the future.")
    .refine((value) => value >= EARLIEST_BIRTHDAY, "Enter a valid birthday."),
});
export type ChildInput = z.infer<typeof childSchema>;

/** Field name helpers for the multi-child registration form. */
export const CHILD_FIELD_PREFIX = "child";
export const childFieldName = (index: number, field: keyof ChildInput) =>
  `${CHILD_FIELD_PREFIX}_${index}_${field}`;

const childFieldPattern = new RegExp(`^${CHILD_FIELD_PREFIX}_(\\d+)_(fullName|gender|birthday)$`);

export type ParsedChildren = {
  children: ChildInput[];
  /** Errors keyed by the submitted field name, e.g. child_0_birthday. */
  fieldErrors: Record<string, string>;
  /** Submitted values keyed by field name, for repopulating the form. */
  values: Record<string, string>;
};

/**
 * Collects child_<i>_<field> entries from FormData, validates each child and
 * returns children in submitted order. Rows with every field blank are
 * ignored so an accidentally added empty row does not block submission.
 */
export function parseChildrenFromForm(formData: FormData): ParsedChildren {
  const rows = new Map<number, Partial<Record<keyof ChildInput, string>>>();
  const values: Record<string, string> = {};

  for (const [key, raw] of formData.entries()) {
    const match = childFieldPattern.exec(key);
    if (!match || typeof raw !== "string") continue;
    const index = Number(match[1]);
    const field = match[2] as keyof ChildInput;
    values[key] = raw;
    rows.set(index, { ...rows.get(index), [field]: raw });
  }

  const children: ChildInput[] = [];
  const fieldErrors: Record<string, string> = {};

  for (const index of [...rows.keys()].sort((a, b) => a - b)) {
    const row = rows.get(index)!;
    const isBlank = !row.fullName?.trim() && !row.gender && !row.birthday?.trim();
    if (isBlank) continue;

    const parsed = childSchema.safeParse({
      fullName: row.fullName ?? "",
      gender: row.gender ?? "",
      birthday: row.birthday ?? "",
    });
    if (parsed.success) {
      children.push(parsed.data);
    } else {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]) as keyof ChildInput;
        const key = childFieldName(index, field);
        if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
      }
    }
  }

  return { children, fieldErrors, values };
}

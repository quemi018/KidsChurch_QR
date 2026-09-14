import { z } from "zod";

import { GUARDIAN_RELATIONSHIPS } from "@/types/app";

import { normalizePhilippineMobile } from "./phone";

export const PASSWORD_MIN_LENGTH = 8;

/** Accepts any PH mobile form and transforms it to E.164. */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Mobile number is required.")
  .transform((value, ctx) => {
    const normalized = normalizePhilippineMobile(value);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid Philippine mobile number, e.g. 0917 123 4567.",
      });
      return z.NEVER;
    }
    return normalized;
  });

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(72, "Password is too long.");

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required.")
  .max(120, "Full name is too long.");

/** Optional email: empty string becomes null; otherwise validated and lowercased. */
export const optionalEmailSchema = z
  .string()
  .trim()
  .max(254, "Email is too long.")
  .transform((value) => (value === "" ? null : value.toLowerCase()))
  .pipe(z.union([z.null(), z.email("Enter a valid email address.")]));

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password is required."),
  next: z.string().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const guardianRegistrationSchema = z
  .object({
    fullName: fullNameSchema,
    guardianRelationship: z.enum(GUARDIAN_RELATIONSHIPS, {
      error: "Select your relationship to the child.",
    }),
    guardianRelationshipOther: z.string().trim().max(120, "Too long.").optional(),
    phone: phoneSchema,
    homeCity: z.string().trim().min(1, "Home city is required.").max(120, "Too long."),
    email: optionalEmailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type GuardianRegistrationInput = z.infer<typeof guardianRegistrationSchema>;

export const createAdminSchema = z
  .object({
    fullName: fullNameSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type CreateAdminInput = z.infer<typeof createAdminSchema>;

export const stationNameSchema = z
  .string()
  .trim()
  .min(1, "Give this station a name, e.g. Registration Laptop.")
  .max(120, "Too long.");

/** Flattens zod issues into { fieldName: firstMessage } for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

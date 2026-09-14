import { z } from "zod";

import { GUARDIAN_RELATIONSHIPS } from "@/types/app";

import { fullNameSchema, optionalEmailSchema, phoneSchema } from "./auth";

/** Fields a guardian may edit on their own profile (spec §11). Phone is separate. */
export const guardianProfileSchema = z.object({
  fullName: fullNameSchema,
  guardianRelationship: z.enum(GUARDIAN_RELATIONSHIPS, {
    error: "Select your relationship to the child.",
  }),
  guardianRelationshipOther: z.string().trim().max(120, "Too long.").optional(),
  homeCity: z.string().trim().min(1, "Home city is required.").max(120, "Too long."),
  email: optionalEmailSchema,
});
export type GuardianProfileInput = z.infer<typeof guardianProfileSchema>;

/** Changing the login identifier requires the current password. */
export const changePhoneSchema = z.object({
  phone: phoneSchema,
  currentPassword: z.string().min(1, "Enter your current password."),
});
export type ChangePhoneInput = z.infer<typeof changePhoneSchema>;

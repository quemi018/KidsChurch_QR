/**
 * Reset any account's password from the command line (Admin or guardian).
 *
 *   node --env-file=.env.local scripts/reset-password.ts
 *
 * There is no self-service "forgot password" flow in Version 1 (accounts are
 * phone-based, email is optional), so an operator with the service-role key
 * resets it here. Requires NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY. The new password is typed hidden and never logged.
 */
import { createClient } from "@supabase/supabase-js";

import { normalizePhilippineMobile } from "../lib/validation/phone.ts";
import { ask, askHidden, fail } from "./lib/prompt.ts";

const MIN_PASSWORD = 8;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    fail(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.local.",
    );
  }

  const phoneInput = await ask("Mobile number of the account (e.g. 0917 123 4567): ");
  const phone = normalizePhilippineMobile(phoneInput);
  if (!phone) fail("Not a valid Philippine mobile number.");

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error: lookupError } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("phone", phone)
    .maybeSingle();
  if (lookupError) fail(`Lookup failed: ${lookupError.message}`);
  if (!profile) fail("No account uses that mobile number.");

  console.log(
    `Account: ${profile.full_name} (${profile.role}${profile.is_active ? "" : ", deactivated"})`,
  );
  const confirmAccount = await ask("Reset this account's password? (yes/no): ");
  if (confirmAccount.toLowerCase() !== "yes") fail("Cancelled.");

  const password = await askHidden("New password: ");
  if (password.length < MIN_PASSWORD) fail(`Password must be at least ${MIN_PASSWORD} characters.`);
  const confirm = await askHidden("Confirm new password: ");
  if (password !== confirm) fail("Passwords do not match.");

  const { error } = await supabase.auth.admin.updateUserById(profile.id, { password });
  if (error) fail(`Could not reset the password: ${error.message}`);

  await supabase.from("audit_logs").insert({
    actor_id: null,
    action: "password_reset",
    entity_type: "profile",
    entity_id: profile.id,
    metadata: { source: "scripts/reset-password.ts" },
  });

  console.log(`\nPassword updated for ${profile.full_name}. They can log in at /login now.`);
}

main();

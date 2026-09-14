/**
 * Bootstrap the first Admin account (or add one from the command line).
 *
 *   node --env-file=.env.local scripts/create-admin.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Prompts for
 * name, mobile number and password (password input is masked). The account is
 * created with app_metadata.role = "admin", which the profiles trigger honours.
 * Further Admins can be created from Admin → Admin Users in the app.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { createClient } from "@supabase/supabase-js";

import { normalizePhilippineMobile } from "../lib/validation/phone.ts";

const MIN_PASSWORD = 8;

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(question);
    let value = "";
    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString("utf8")) {
        if (char === "\n" || char === "\r") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "") process.exit(130); // Ctrl+C
        if (char === "" || char === "\b") value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.local.",
    );
    process.exit(1);
  }

  const fullName = await ask("Admin full name: ");
  if (!fullName) return fail("Full name is required.");

  const phoneInput = await ask("Mobile number (e.g. 0917 123 4567): ");
  const phone = normalizePhilippineMobile(phoneInput);
  if (!phone) return fail("Not a valid Philippine mobile number.");

  const password = await askHidden("Password: ");
  if (password.length < MIN_PASSWORD)
    return fail(`Password must be at least ${MIN_PASSWORD} characters.`);
  const confirm = await askHidden("Confirm password: ");
  if (password !== confirm) return fail("Passwords do not match.");

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    phone,
    password,
    phone_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { full_name: fullName },
  });

  if (error) return fail(`Could not create admin: ${error.message}`);

  await supabase.from("audit_logs").insert({
    actor_id: null,
    action: "admin_created",
    entity_type: "profile",
    entity_id: data.user.id,
    metadata: { full_name: fullName, source: "scripts/create-admin.ts" },
  });

  console.log(`\nAdmin created: ${fullName} (${phone}). Log in at /login.`);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

main();

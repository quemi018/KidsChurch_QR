import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

import { getPublicSupabaseEnv } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Reads the caller's auth cookies, so queries run as the signed-in user and
 * are subject to Row Level Security. Create a new client per request — never
 * cache it in a module-level variable.
 */
export async function createClient() {
  const { url, publishableKey } = getPublicSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies cannot be written.
          // Safe to ignore: `proxy.ts` refreshes the session on every request.
        }
      },
    },
  });
}

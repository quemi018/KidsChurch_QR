import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseEnv } from "./env";

/**
 * Supabase client for Client Components.
 *
 * `createBrowserClient` is a singleton under the hood, so calling this
 * repeatedly is cheap. Uses the publishable key only; every query is subject
 * to Row Level Security.
 */
export function createClient() {
  const { url, publishableKey } = getPublicSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}

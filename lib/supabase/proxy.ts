import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseEnv, isSupabaseConfigured } from "./env";

/**
 * Refreshes the Supabase auth session on every matched request.
 *
 * Responsibilities (per Supabase SSR guidance):
 * 1. Refresh an expired auth token via `getClaims()`.
 * 2. Forward refreshed cookies to Server Components via `request.cookies`.
 * 3. Forward refreshed cookies to the browser via the response.
 *
 * Route protection (member/admin guards, Registration Station gate) is
 * layered on top of this in Phase 3. This module deliberately does nothing
 * else so it stays safe to run on every request.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    // Local scaffolding without a Supabase project yet. Fail loudly outside development.
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Supabase environment variables are missing.");
    }
    return supabaseResponse;
  }

  const { url, publishableKey } = getPublicSupabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        // Cache-control headers that stop CDNs from caching a response carrying a session.
        Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
      },
    },
  });

  // Do not run code between createServerClient and getClaims(); it can cause
  // users to be logged out at random.
  await supabase.auth.getClaims();

  // Must return the same response object so refreshed cookies reach the browser.
  return supabaseResponse;
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  isStationGatedPath,
  STATION_COOKIE_NAME,
  STATION_GATE_ENABLED,
  STATION_REQUIRED_PATH,
} from "@/lib/auth/station-policy";
import type { Database } from "@/types/database";

import { authCookieOptions } from "./cookie-options";
import { getPublicSupabaseEnv, isSupabaseConfigured } from "./env";

/** Route prefixes that require a signed-in user. Role checks happen in the layouts. */
const AUTH_REQUIRED_PREFIXES = ["/member", "/admin"];

function startsWithAny(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Runs on every matched request:
 * 1. Refreshes the Supabase auth session (cookies) via `getClaims()`.
 * 2. Redirects signed-out visitors away from /member and /admin.
 * 3. Cheap Registration Station pre-check (cookie present?) for gated paths.
 *
 * Everything here is a convenience layer. The authoritative checks are the
 * database RLS policies, `requireAdmin()/requireMember()` in layouts, and
 * `getCurrentStation()` in pages and actions.
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

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookieOptions: authCookieOptions,
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
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);

  const { pathname } = request.nextUrl;

  const redirectTo = (target: string, next?: string) => {
    const destination = request.nextUrl.clone();
    destination.pathname = target;
    destination.search = next ? `?next=${encodeURIComponent(next)}` : "";
    const response = NextResponse.redirect(destination);
    // Carry refreshed auth cookies on the redirect so the session is not lost.
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  if (!isSignedIn && startsWithAny(pathname, AUTH_REQUIRED_PREFIXES)) {
    return redirectTo("/login", pathname + request.nextUrl.search);
  }

  if (
    STATION_GATE_ENABLED &&
    isStationGatedPath(pathname) &&
    !request.cookies.get(STATION_COOKIE_NAME)
  ) {
    return redirectTo(STATION_REQUIRED_PATH);
  }

  // Must return the same response object so refreshed cookies reach the browser.
  return supabaseResponse;
}

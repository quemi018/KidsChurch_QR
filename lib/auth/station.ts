import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";

import {
  STATION_COOKIE_MAX_AGE_SECONDS,
  STATION_COOKIE_NAME,
  STATION_GATE_ENABLED,
  STATION_REQUIRED_PATH,
} from "./station-policy";

export type CurrentStation = {
  id: string;
  name: string;
  activatedAt: string;
};

/** Only touch last_used_at when it is older than this, to avoid a write per request. */
const LAST_USED_REFRESH_MS = 15 * 60 * 1000;

export function generateStationToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashStationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function setStationCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(STATION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STATION_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearStationCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(STATION_COOKIE_NAME);
}

/**
 * Resolves the station for this browser, or null. Validated against the
 * database (active row with a matching token hash) using the service-role
 * client, because the visitor is usually anonymous at registration time.
 * The raw token never leaves the cookie; only its hash is compared.
 */
export const getCurrentStation = cache(async (): Promise<CurrentStation | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(STATION_COOKIE_NAME)?.value;
  if (!token) return null;

  const admin = createAdminClient();
  const { data: station, error } = await admin
    .from("registration_stations")
    .select("id, name, created_at, last_used_at")
    .eq("station_token_hash", hashStationToken(token))
    .eq("is_active", true)
    .maybeSingle();

  if (error || !station) return null;

  const lastUsed = station.last_used_at ? Date.parse(station.last_used_at) : 0;
  if (Date.now() - lastUsed > LAST_USED_REFRESH_MS) {
    await admin
      .from("registration_stations")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", station.id);
  }

  return { id: station.id, name: station.name, activatedAt: station.created_at };
});

/** True when the gate is disabled or this browser is an active station. */
export async function isStationSatisfied(): Promise<boolean> {
  if (!STATION_GATE_ENABLED) return true;
  return (await getCurrentStation()) !== null;
}

/** For Server Components: redirect away unless this browser is a station. */
export async function requireStation(): Promise<void> {
  if (!(await isStationSatisfied())) redirect(STATION_REQUIRED_PATH);
}

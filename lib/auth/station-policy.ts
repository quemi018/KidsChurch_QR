/**
 * Registration Station gate policy (spec §7.1).
 *
 * Member registration/profile screens are meant for the church Registration
 * Laptop only. A browser becomes a station when an Admin activates it, which
 * sets an HttpOnly cookie whose hash is stored in `registration_stations`.
 *
 * This file is import-safe from `proxy.ts` (no Node-only APIs). The
 * authoritative check lives in `station.ts` (server-only, hits the database);
 * the proxy only does a cheap "cookie present?" pre-check.
 *
 * To relax the restriction in a future version, set STATION_GATE_ENABLED to
 * false — every check reads this flag.
 */
export const STATION_GATE_ENABLED = true;

export const STATION_COOKIE_NAME = "vckc_station";

/** Cookie lifetime: one year. Admins can revoke earlier from Admin → Settings. */
export const STATION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Route prefixes that require the browser to be an activated Registration Station. */
const STATION_GATED_PREFIXES = ["/register", "/member"] as const;

export const STATION_REQUIRED_PATH = "/station-required";

export function isStationGatedPath(pathname: string): boolean {
  return STATION_GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

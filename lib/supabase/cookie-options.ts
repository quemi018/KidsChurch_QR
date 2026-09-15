/**
 * Cookie flags for the Supabase auth session (spec §34 "use secure cookies").
 * `Secure` only in production so local HTTP development keeps working.
 * Not HttpOnly: @supabase/ssr's browser client must read the session cookie.
 */
export const authCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

# Victory Caloocan Kids Church

Web application that replaces the handwritten Kids Church logbook. Guardians register once
at the church Registration Station, add one or more children, and receive a permanent
QR code per child. On later visits an Admin scans the QR with a USB scanner and attendance
is recorded automatically.

The full product and technical specification lives in [`spec.md`](./spec.md) — it is the
source of truth for this project.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) — PostgreSQL, Auth, Row Level Security, Realtime
- [Resend](https://resend.com) — transactional email (QR delivery), server-side only
- GitHub for source control, Vercel for hosting

## Local setup

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open <http://localhost:3000>.

> Windows PowerShell may block `npm` with "running scripts is disabled". Use `npm.cmd run dev`
> (or run scripts through `node` directly, e.g. `node --env-file=.env.local scripts/create-admin.ts`).

### Environment variables

See [`.env.example`](./.env.example). `.env.local` is git-ignored — never commit real keys.

| Variable                               | Where used       | Notes                                               |
| -------------------------------------- | ---------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | browser + server | Supabase project URL                                |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | browser + server | Publishable (anon) key; all access goes through RLS |
| `SUPABASE_SERVICE_ROLE_KEY`            | server only      | Bypasses RLS. Never expose to the browser.          |
| `RESEND_API_KEY`                       | server only      | Email provider key                                  |
| `EMAIL_FROM`                           | server only      | Sender for QR emails                                |
| `APP_URL`                              | server           | Public base URL of the deployment                   |
| `APP_TIMEZONE`                         | server           | `Asia/Manila`                                       |

Without Supabase variables the app still starts in development (the session proxy skips
itself and `GET /api/health` reports `supabaseConfigured: false`). In production the
proxy fails loudly if they are missing.

## Scripts

| Command                | Purpose                       |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Start the dev server          |
| `npm run build`        | Production build              |
| `npm run start`        | Serve the production build    |
| `npm run lint`         | ESLint                        |
| `npm run typecheck`    | `tsc --noEmit`                |
| `npm run format`       | Prettier (write)              |
| `npm run format:check` | Prettier (check only, for CI) |

## Project structure

```text
app/
  (auth)/            login, register
  member/            guardian dashboard, profile, children
  admin/             dashboard, scanner, sessions, attendance, guardians, children, settings, admin-users
  api/               route handlers (server-side endpoints)
components/
  admin/ member/ qr/ ui/
lib/
  supabase/          browser, server, service-role (admin) clients + session proxy
  auth/ qr/ email/ validation/ utils/
supabase/migrations/ SQL migrations (committed; applied to every environment)
types/               shared TypeScript types
proxy.ts             Next.js request proxy — refreshes the Supabase session on every request
```

### Supabase clients (`lib/supabase`)

| File        | Use in                                       | Key          | RLS      |
| ----------- | -------------------------------------------- | ------------ | -------- |
| `client.ts` | Client Components                            | publishable  | enforced |
| `server.ts` | Server Components / Actions / Route Handlers | publishable  | enforced |
| `admin.ts`  | Trusted server code only (`server-only`)     | service role | bypassed |

## Database

Schema lives in [`supabase/migrations/`](./supabase/migrations) and is applied to the
Supabase project **KidsChurch_QR**. Every schema change is a new migration file; never
edit the database by hand.

| Table                   | Purpose                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `profiles`              | One row per Auth user (`role` = `member` or `admin`)            |
| `children`              | Children per guardian; permanent opaque `qr_token`; soft-delete |
| `church_sessions`       | Kids Church services; at most one `open` at a time              |
| `attendance`            | Check-ins with snapshots; `UNIQUE(session_id, child_id)`        |
| `registration_stations` | Admin-activated browsers allowed to use Member screens          |
| `audit_logs`            | Append-only record of sensitive Admin actions                   |

Security model (all enforced in the database, not just the UI):

- RLS is enabled on every table; `anon` has no table privileges at all.
- `public.is_admin()` (SECURITY DEFINER) backs every Admin policy — the role is read from
  `profiles.role`, never from client state.
- A profile is created by trigger when an Auth user is created. `role` comes only from
  `app_metadata` (server-settable), so a client can never register as an admin.
- Triggers block privileged column changes RLS cannot express: members cannot change
  `role`, `phone`, `is_active`, `qr_token`, `guardian_id`, or archive fields.
- `role` and `qr_token` changes are server-only (service role); admins archive/reactivate.
- Duplicate check-ins and a second open session are rejected by unique indexes.
- Children with attendance history cannot be deleted (`ON DELETE RESTRICT`).
- Realtime publishes `attendance` and `church_sessions`; RLS filters what each subscriber sees.

### Applying migrations

Migrations were applied to the project via the Supabase MCP in the same order as the
files. To apply to a fresh project with the CLI:

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

### Regenerating database types

After any migration, regenerate [`types/database.ts`](./types/database.ts) (CLI shown;
the Supabase MCP `generate_typescript_types` tool produces the same output):

```bash
npx supabase gen types typescript --project-id <ref> > types/database.ts
npx prettier --write types/database.ts
```

## Authentication

Everyone (guardians and Admins) signs in with **mobile number + password** through Supabase
Auth. Numbers are normalised to E.164 (`09171234567` → `+639171234567`) before they reach
Supabase. No SMS/OTP in Version 1.

### Supabase Auth settings (one-time, in the dashboard)

| Setting                                                               | Value | Why                                                                     |
| --------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------- |
| Authentication → Providers → Phone → **Enable**                       | on    | Required for phone + password sign-in                                   |
| Phone → **Confirm phone**                                             | off   | No OTP in V1. The SMS provider fields may hold placeholders; never used |
| Authentication → Sign In / Providers → **Allow new users to sign up** | off   | Accounts are created server-side only (see below)                       |

### How accounts are created

Public sign-up is disabled so the Registration Station gate cannot be bypassed by calling
Supabase directly. All accounts are created with the service-role admin API:

- **Guardians** — `/register` on an activated Registration Station
  (`lib/auth/actions.ts → registerGuardianAction`).
- **Admins** — by an existing Admin at `/admin/admin-users`, or for the very first Admin:

```bash
npm run create-admin
```

The script reads `.env.local` (needs `SUPABASE_SERVICE_ROLE_KEY`) and prompts for name,
mobile number and password. Admin role is set via `app_metadata.role`, which only the
service role can write; the database trigger copies it into `profiles.role`.

### Authorization layers

1. **Database RLS** — the real boundary (see Database above).
2. **`proxy.ts`** — refreshes the session; redirects signed-out visitors from `/member` and
   `/admin` to `/login`; cheap Registration Station cookie pre-check.
3. **Layouts** — `requireAdmin()` / `requireMember()` read the role from `profiles` on every
   request and redirect on mismatch; deactivated accounts land on `/deactivated`.
4. **Server Actions** — re-check the caller (`getActiveUserWithRole`) before every write.

### Registration Station gate

`/register` and `/member/*` only work in a browser an Admin has activated from
**Admin → Settings**. Activation stores a SHA-256 hash of a random token in
`registration_stations` and sets an HttpOnly cookie with the raw token; every gated request
validates the cookie against the database. Admins can revoke any station from the same page.
`/login` is deliberately not gated (Admins must sign in to activate a station).

To relax the gate in a future version, flip `STATION_GATE_ENABLED` in
[`lib/auth/station-policy.ts`](./lib/auth/station-policy.ts).

## Build phases

Development follows the phases in `spec.md` §53. Screens scheduled for a later phase
render a placeholder that names the phase.

- [x] Phase 1 — Project foundation
- [x] Phase 2 — Database and security (migrations, RLS)
- [x] Phase 3 — Authentication and Registration Station gate
- [ ] Phase 4 — Guardian + children
- [ ] Phase 5 — QR generation and email delivery
- [ ] Phase 6 — Kids Church sessions
- [ ] Phase 7 — Scanner + attendance
- [ ] Phase 8 — Realtime Admin dashboard
- [ ] Phase 9 — Attendance history
- [ ] Phase 10 — Testing and hardening
- [ ] Phase 11 — Deployment (Vercel)

## Deployment

Vercel configuration is completed in Phase 11. Until then: the project builds with
`npm run build` and every secret is read from environment variables, so it is ready to be
imported into Vercel with the variables above set in the project settings.

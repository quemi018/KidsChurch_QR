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

## Build phases

Development follows the phases in `spec.md` §53. Screens scheduled for a later phase
render a placeholder that names the phase.

- [x] Phase 1 — Project foundation
- [x] Phase 2 — Database and security (migrations, RLS)
- [ ] Phase 3 — Authentication and Registration Station gate
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

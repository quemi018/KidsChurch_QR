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

## Build phases

Development follows the phases in `spec.md` §53. Screens scheduled for a later phase
render a placeholder that names the phase.

- [x] Phase 1 — Project foundation
- [ ] Phase 2 — Database and security (migrations, RLS)
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

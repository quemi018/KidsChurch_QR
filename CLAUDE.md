@AGENTS.md

# Project notes

- `spec.md` is the product and technical source of truth. Do not remove specified requirements.
- Build in the phase order of `spec.md` §53; do not skip ahead.
- Secrets are server-only. Never prefix a secret with `NEXT_PUBLIC_`, never commit `.env.local`.
- Authorization lives in the database (RLS) and server code, never only in the UI.
- QR payloads are opaque tokens (`vckc:<token>`) — never PII.

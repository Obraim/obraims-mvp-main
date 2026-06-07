# Obraims Production Checkpoint: Intake Production Ready

Date: 2026-05-03

## Deployed Commit

- Commit SHA: `47b68fdbbeeb43a7f1749008a055fae95336fb83`
- Commit summary: `47b68fd Fix Obraims chat intake persistence`

## Production Targets

- Supabase project ref: `lbbvyyhngbseqwplnddx`
- Supabase project URL: `https://lbbvyyhngbseqwplnddx.supabase.co`
- Vercel production URL: `https://obraims-mvp.vercel.app`

## Migrations Applied

- `20260502000100`
- `20260502000200`
- `20260503000100_obraims_intake_chat_fields.sql`

The intake chat fields migration is applied to the production Supabase project and tracked in migration history.

## Smoke Test Applications

- Guided chat intake application ID: `cc87d80c-3d81-495a-a795-db817e59cc42`
- Traditional intake application ID: `32667dce-4396-45b9-8fcc-1b028b455d86`

## Known-Good Features

- Guided chat intake works in production.
- Traditional intake works in production.
- Applications persist to Supabase.
- Applications appear in `/app/admin/applications`.
- Application detail shows address, collateral, documents, and source.
- Vercel environment variables are configured.
- Supabase migration `20260503000100_obraims_intake_chat_fields.sql` is applied and tracked.
- Admin Auth user exists.
- RLS remains protected.

## Remaining Optional Hardening

- Add explicit server-side `console.error` logging in server action catch paths so production insert failures are visible in server logs as well as surfaced to the UI.

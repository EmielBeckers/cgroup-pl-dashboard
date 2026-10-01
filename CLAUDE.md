# P&L Dashboard — Project Context

Part of C.Group's internal tooling. Master context: `/Users/emielbeckers/Desktop/cgroup-ops/CLAUDE.md`.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind 4. Read `node_modules/next/dist/docs/` before writing code (see AGENTS.md). |
| Data | Supabase project **cgroup-pl** (`ezhdbjmiyuphoxiulpdz`): Postgres + Auth + Storage |
| Hosting | Vercel (auto-deploys from GitHub). Emiel deploys; agents don't. |

There is **no mock data** any more: the seed/refresh scripts and the nightly mock workflow were removed (commit `200518e`). All figures come from live views.

## Where the data comes from

- Accounting data is loaded into cgroup-pl's `adsolut` schema by the separate repo **cgroup-adsolut-sync**.
- The app reads role-gated wrapper views and RPCs in `public`:
  - P&L: `pl_entity`, `pl_venue`, `pl_hotel`, `pl_month`, `pl_venue_month`, `pl_exclusions`, `pl_dossiers`, `pl_venues`
  - Invoices: `invoices`, `invoices_summary()`, `pl_invoice_lines()` and the `pl_*_line_invoices()` drills
  - Items: `items`, `item_prices`, `product_groups` and the `pg_*()` RPCs
- `lib/pl-live.ts` only groups and sums rows the views return. It never derives amounts or classifies accounts.
- `supabase/*.sql` are historical setup files, not a current schema dump.

## Auth and access

- `lib/supabase/server.ts` (server components) and `proxy.ts` (the auth guard; Next 16's replacement for middleware) use `@supabase/ssr` with the **anon key and the user's session**. `lib/supabase/client.ts` is browser-only and used just for sign-out.
- Roles live in `public.user_profiles.role`: `board` | `accounting` | `manager`.
  - Access is enforced in the database (RLS / role-gated views).
  - Each page also checks the role server-side and redirects.
  - The sidebar hides links using the same rule.
- No service key is used at runtime. `SUPABASE_SERVICE_KEY` is only read by the build-time honesty check.

## Routes (`app/(dashboard)/`)

`/group` (group P&L; `/` and `/dashboard` redirect here) · `/entity/[dossier]` · `/entity/[dossier]/venue/[venue]` · `/compare` · `/invoices` · `/items` · `/leveranciers` · `/staff-discount` (board only) · `/api/invoice-pdf` (signed URL, board/accounting only).

## Staff discount (`/staff-discount`, board only)

- **Data source:** a second, server-only source, the Supabase project **SDWorx** (`hjokwgquhanyipenzufe`), views `hr_sync.v_discount_*`. Those views are built by the repo **cgroup-employee-sync**, which syncs Leat transactions hourly.
- **Access:** `lib/hr-db.ts` (`import 'server-only'`) connects with the `postgres` driver as the read-only role `discount_dashboard_ro`, which can SELECT the `v_discount_*` views only.
  - The connection goes through the transaction pooler, with `prepare: false` and queries run **sequentially**, because parallel queries hang behind the pooler.
  - SDWorx doesn't know cgroup-pl users, so the board-only rule lives in the page and in `getStaffDiscountData()`.
- **Never copy HR data into cgroup-pl.**
- **Amounts:** `ticket_as_posted` is what the colleague **paid, after discount** (confirmed 2026-10-01), shown as "Betaald". Never derive gross or discount euros from it: drinks are charged at full price on the same ticket, so paid ÷ 0.75 is wrong. Trivec doesn't send the discount amount.

## Honest data rule

`npm run build` runs `scripts/check-honesty.mjs` first.
- It fails on any amount × ratio literal in `lib/`, `components/` or `app/`.
- It fails on `line`/`section` rows in `PL_ROWS`.
- When credentials are present, it fails on ratio literals in cgroup-pl view definitions.
- Every displayed split must trace to source data. If a metric isn't supported by the data, say so on screen; never show a placeholder.

## Environment variables

| Name | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | cgroup-pl, user-session client |
| `SUPABASE_SERVICE_KEY` | build only (optional) | honesty check's DB rule |
| `SDWORX_DISCOUNT_DB_URL` | Vercel + `.env.local`, **server only** | SDWorx pooler URL for `discount_dashboard_ro` (user `discount_dashboard_ro.hjokwgquhanyipenzufe`, port 6543). Rotate: `ALTER ROLE` with a new SCRAM verifier, then update this var in Vercel. |

`.env*` files are git-ignored.

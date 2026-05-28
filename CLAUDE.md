# P&L Dashboard — Project Context

Part of C.Group's internal tooling. See the master context file at `/Users/emielbeckers/Desktop/cgroup-ops/CLAUDE.md`.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind 4 |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Hosting | Vercel (connects to GitHub, auto-deploys) |
| Nightly refresh | GitHub Actions (`.github/workflows/nightly-refresh.yml`) |

## Project structure

```
app/
  (dashboard)/              ← All authenticated pages share this layout
    dashboard/              ← Main overview (all companies, current month)
    companies/              ← Company list + [id] detail page (full USALI P&L)
    venues/                 ← Venue list + [id] detail page (full USALI P&L)
    invoices/               ← Invoice list
      review/               ← AI review queue (accounting/board only)
  api/
    categorize-invoices/    ← POST endpoint: calls Claude Haiku to categorise pending_ai invoices
  login/                    ← Public login page
components/
  ui/                       ← card, badge, button, kpi-card
  layout/                   ← sidebar (with entity list), top-bar
  charts/                   ← revenue-trend (AreaChart), pl-waterfall (BarChart)
  pl/
    pl-statement.tsx        ← Full USALI P&L table component (client, collapse/expand)
lib/
  supabase/client.ts        ← Browser client (client components)
  supabase/server.ts        ← Server client (server components + middleware)
  types.ts                  ← All TypeScript interfaces
  utils.ts                  ← cn(), formatCurrency(), derivePl(), sumSnapshots(), monthLabel()
  pl-structure.ts           ← PL_ROWS definition, USALI_EXPENSE_CATEGORIES, USALI_TO_COLUMN
proxy.ts                    ← Auth guard: redirect to /login if not signed in
scripts/
  seed.ts                   ← One-time mock data loader (npm run seed)
  refresh.ts                ← Nightly job (npm run refresh / GitHub Actions)
supabase/
  schema.sql                ← Run this once in Supabase SQL editor to create tables
  migration_v2.sql          ← Run AFTER schema.sql to add USALI columns + AI invoice fields
```

## Setup steps (do these once)

### 1. Supabase

1. Create a new project at supabase.com
2. Go to SQL Editor and paste + run the contents of `supabase/schema.sql`
3. Go to Project Settings → API, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY`
4. Create your admin user: Authentication → Users → Invite user
5. In SQL Editor, insert their profile:
   ```sql
   insert into user_profiles (id, role, full_name)
   values ('<paste user UUID from Auth tab>', 'board', 'Your Name');
   ```

### 2. Seed mock data

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
npm run seed
```

This loads 17 months (Jan 2024 – May 2025) of realistic P&L data.

### 3. Run locally

```bash
npm run dev
# Open http://localhost:3000 → redirects to /login
```

### 4. Deploy to Vercel

1. Push this folder to a private GitHub repository
2. Go to vercel.com → Add New Project → import the repo
3. In Vercel project settings → Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
4. Deploy — takes ~2 minutes

### 5. Set up nightly refresh (GitHub Actions)

1. In GitHub repo → Settings → Secrets and variables → Actions, add:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SERVICE_KEY` = your service role key
2. The job runs automatically every night at 02:00 Brussels time
3. You can also trigger it manually: Actions tab → Nightly P&L Refresh → Run workflow

## Venue → company mapping

This is our best estimate based on company names. **Confirm with Emiel and update `scripts/seed.ts` if wrong.**

| Company | Venues |
|---|---|
| HasHotel | HASHOTEL, BRAGOÛT |
| Century | THE CENTURY |
| Mia Mensa | MIA MENSA |
| C. Corda | HET CORDAAT, CORDA.BAR, CORDA.CUISINE |
| Green Valley Hospitality | ODIEL BISTRONOMIE, ATELIER V, TRENTANOVE, MAISON MATHIS, TERLAND, VANHARTE, DE COMMANDEUR |
| Blue Ocean Hospitality | C.BAR, BAR BOUFFE JESSA, BAR BOUFFE ZOL, BAR BOUFFE ST-BARBARA, BAR BOUFFE ZMK, BAR BOUFFE TRUDO, THE ALLEY'S |
| C. Outdoor | PLAGE ODETTE |
| C.Group, C. Construx, R&R FIN, Customizze | No F&B venues (holding/support entities) |

## AI invoice categorisation

- Model: `claude-haiku-4-5-20251001`
- New invoices are seeded with `review_status = 'pending_ai'`
- `POST /api/categorize-invoices` processes them in batches of 10
- Confidence ≥ 90%: auto-confirmed (`review_status = 'auto_confirmed'`)
- Confidence < 90%: goes to accounting queue (`review_status = 'pending_review'`)
- Accounting/board can accept or correct at `/invoices/review`
- Nightly refresh calls the endpoint automatically if `ANTHROPIC_API_KEY` is set
- Required secrets for GitHub Actions: `ANTHROPIC_API_KEY`, `SITE_URL`

## Database migrations

1. Run `supabase/schema.sql` first (creates all tables)
2. Run `supabase/migration_v2.sql` to add USALI columns and AI invoice fields

## When Adsolut API goes live

1. In `scripts/refresh.ts`, replace `generateMockMonth()` with a real Adsolut API call
2. Refer to `../src/fetch_accounting.py` for the existing OAuth flow
3. Change `data_source: 'mock'` to `data_source: 'adsolut_live'`
4. Test with one company first (HasHotel is the pilot)
5. Roll out to remaining companies

## Adding users

In Supabase dashboard:
1. Authentication → Users → Invite user (enter their email)
2. They receive a password setup email
3. After they accept, go to SQL Editor and run:
   ```sql
   -- For board/accounting:
   insert into user_profiles (id, role, full_name)
   values ('<uuid>', 'accounting', 'Naam Achternaam');

   -- For a manager (only sees their venues):
   insert into user_profiles (id, role, full_name, venue_ids)
   values ('<uuid>', 'manager', 'Naam Achternaam',
     array['<venue-uuid-1>', '<venue-uuid-2>']::uuid[]);
   ```
4. Find venue UUIDs: `select id, name from venues order by name;`

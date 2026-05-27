-- ============================================================
-- C.Group P&L Dashboard — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── COMPANIES ──────────────────────────────────────────────
create table if not exists companies (
  id            uuid primary key default gen_random_uuid(),
  adsolut_id    uuid unique not null,
  name          text not null,
  display_name  text not null,
  vat_number    text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── VENUES ─────────────────────────────────────────────────
create table if not exists venues (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid references companies(id) on delete restrict not null,
  name        text not null,
  type        text check (type in ('restaurant','hotel','bar','other')) default 'restaurant',
  pos_system  text check (pos_system in ('trivec','lightspeed','none')) default 'trivec',
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── USER PROFILES ──────────────────────────────────────────
-- Extends Supabase auth.users with role and venue access
create table if not exists user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text check (role in ('board','accounting','manager')) not null,
  full_name   text not null,
  venue_ids   uuid[] default '{}',
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── P&L SNAPSHOTS ──────────────────────────────────────────
-- One row per company (or venue) per calendar month.
-- venue_id null = company-level aggregate.
-- Follows USALI F&B structure.
create table if not exists pl_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid references companies(id) on delete cascade not null,
  venue_id            uuid references venues(id) on delete set null,
  period_year         int not null,
  period_month        int not null check (period_month between 1 and 12),
  -- Revenue (USALI)
  revenue_food        numeric(12,2) default 0,
  revenue_beverage    numeric(12,2) default 0,
  revenue_other       numeric(12,2) default 0,
  -- Cost of Sales
  cogs_food           numeric(12,2) default 0,
  cogs_beverage       numeric(12,2) default 0,
  -- Labour & Related
  labour_management   numeric(12,2) default 0,
  labour_service      numeric(12,2) default 0,
  labour_kitchen      numeric(12,2) default 0,
  -- Other Operating Expenses
  overhead_rent       numeric(12,2) default 0,
  overhead_utilities  numeric(12,2) default 0,
  overhead_marketing  numeric(12,2) default 0,
  overhead_other      numeric(12,2) default 0,
  -- Metadata
  data_source         text check (data_source in ('adsolut_live','mock')) default 'mock',
  refreshed_at        timestamptz default now(),
  created_at          timestamptz default now(),
  unique (company_id, venue_id, period_year, period_month)
);

-- ── INVOICES ───────────────────────────────────────────────
create table if not exists invoices (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid references companies(id) on delete restrict not null,
  venue_id            uuid references venues(id) on delete set null,
  adsolut_invoice_id  text unique,
  invoice_number      text not null,
  invoice_date        date not null,
  due_date            date,
  supplier_name       text not null,
  amount_excl_vat     numeric(12,2) not null,
  vat_amount          numeric(12,2) default 0,
  amount_incl_vat     numeric(12,2) not null,
  usali_category      text,
  status              text check (status in ('pending','paid','overdue')) default 'pending',
  pdf_url             text,
  is_archived         boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ── REFRESH LOG ────────────────────────────────────────────
create table if not exists refresh_log (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid references companies(id) on delete set null,
  run_at           timestamptz default now(),
  status           text check (status in ('success','failed','skipped')) not null,
  records_fetched  int default 0,
  error_message    text
);

-- ── INDEXES ────────────────────────────────────────────────
create index if not exists idx_pl_snapshots_company_period
  on pl_snapshots (company_id, period_year desc, period_month desc);

create index if not exists idx_pl_snapshots_venue_period
  on pl_snapshots (venue_id, period_year desc, period_month desc);

create index if not exists idx_invoices_company_date
  on invoices (company_id, invoice_date desc);

create index if not exists idx_invoices_status
  on invoices (status) where is_archived = false;

-- ── ROW LEVEL SECURITY ─────────────────────────────────────
alter table companies       enable row level security;
alter table venues          enable row level security;
alter table user_profiles   enable row level security;
alter table pl_snapshots    enable row level security;
alter table invoices        enable row level security;
alter table refresh_log     enable row level security;

-- Helper: get the current user's role
create or replace function get_user_role()
returns text
language sql
security definer
stable
as $$
  select role from user_profiles where id = auth.uid() and is_active = true;
$$;

-- Helper: get the current user's venue IDs
create or replace function get_user_venue_ids()
returns uuid[]
language sql
security definer
stable
as $$
  select coalesce(venue_ids, '{}') from user_profiles where id = auth.uid() and is_active = true;
$$;

-- ── RLS POLICIES: companies ─────────────────────────────────
create policy "board_accounting_see_all_companies"
  on companies for select
  using (get_user_role() in ('board','accounting'));

create policy "managers_see_own_company"
  on companies for select
  using (
    get_user_role() = 'manager'
    and id in (
      select company_id from venues where id = any(get_user_venue_ids())
    )
  );

-- ── RLS POLICIES: venues ────────────────────────────────────
create policy "board_accounting_see_all_venues"
  on venues for select
  using (get_user_role() in ('board','accounting'));

create policy "managers_see_own_venues"
  on venues for select
  using (
    get_user_role() = 'manager'
    and id = any(get_user_venue_ids())
  );

-- ── RLS POLICIES: user_profiles ─────────────────────────────
create policy "users_see_own_profile"
  on user_profiles for select
  using (id = auth.uid());

create policy "board_sees_all_profiles"
  on user_profiles for select
  using (get_user_role() = 'board');

create policy "board_manages_profiles"
  on user_profiles for all
  using (get_user_role() = 'board');

-- ── RLS POLICIES: pl_snapshots ──────────────────────────────
create policy "board_accounting_see_all_pl"
  on pl_snapshots for select
  using (get_user_role() in ('board','accounting'));

create policy "managers_see_own_pl"
  on pl_snapshots for select
  using (
    get_user_role() = 'manager'
    and company_id in (
      select company_id from venues where id = any(get_user_venue_ids())
    )
  );

create policy "service_role_manage_pl"
  on pl_snapshots for all
  using (auth.role() = 'service_role');

-- ── RLS POLICIES: invoices ──────────────────────────────────
create policy "board_accounting_see_all_invoices"
  on invoices for select
  using (get_user_role() in ('board','accounting'));

create policy "service_role_manage_invoices"
  on invoices for all
  using (auth.role() = 'service_role');

-- ── RLS POLICIES: refresh_log ───────────────────────────────
create policy "board_accounting_see_refresh_log"
  on refresh_log for select
  using (get_user_role() in ('board','accounting'));

create policy "service_role_manage_refresh_log"
  on refresh_log for all
  using (auth.role() = 'service_role');

-- ── AUTO-UPDATE updated_at ──────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_companies_updated_at
  before update on companies
  for each row execute function update_updated_at();

create trigger trg_venues_updated_at
  before update on venues
  for each row execute function update_updated_at();

create trigger trg_user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at();

create trigger trg_invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at();

-- ============================================================
-- C.Group P&L Dashboard — Migration v2
-- Run in Supabase SQL Editor AFTER schema.sql
-- Safe to run on existing data — all new columns default to 0
-- ============================================================

-- ── pl_snapshots: new revenue columns ──────────────────────
alter table pl_snapshots add column if not exists revenue_rooms               numeric(12,2) default 0;
alter table pl_snapshots add column if not exists revenue_other_operated_depts numeric(12,2) default 0;
alter table pl_snapshots add column if not exists revenue_misc_income          numeric(12,2) default 0;

-- ── pl_snapshots: new cost of sales columns ────────────────
alter table pl_snapshots add column if not exists cogs_rooms                  numeric(12,2) default 0;
alter table pl_snapshots add column if not exists cogs_other_operated_depts   numeric(12,2) default 0;

-- ── pl_snapshots: Other Expenses (full USALI list) ─────────
alter table pl_snapshots add column if not exists exp_banquet                 numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_china                   numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_cleaning_supplies       numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_cluster_services        numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_commissions             numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_complimentary           numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_contract_services       numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_corporate_office        numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_decorations             numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_dishwashing             numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_dues_subscriptions      numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_entertainment_inhouse   numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_equipment_rental        numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_flatware                numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_glassware               numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_ice                     numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_kitchen_fuel            numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_kitchen_smallwares      numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_laundry                 numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_licenses                numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_linen                   numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_menus                   numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_miscellaneous           numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_music_entertainment     numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_operating_supplies      numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_paper_plastics          numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_postage                 numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_printing                numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_reservations            numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_royalty_fees            numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_training                numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_travel_meals            numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_travel_other            numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_uniform_costs           numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_uniform_laundry         numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_utensils                numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_admin_general           numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_it_systems              numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_sales_marketing         numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_property_maintenance    numeric(12,2) default 0;
alter table pl_snapshots add column if not exists exp_utilities               numeric(12,2) default 0;

-- ── pl_snapshots: below-GOP lines ──────────────────────────
alter table pl_snapshots add column if not exists management_fees             numeric(12,2) default 0;
alter table pl_snapshots add column if not exists nonop_rent                  numeric(12,2) default 0;
alter table pl_snapshots add column if not exists nonop_taxes                 numeric(12,2) default 0;
alter table pl_snapshots add column if not exists nonop_insurance             numeric(12,2) default 0;
alter table pl_snapshots add column if not exists nonop_other                 numeric(12,2) default 0;
alter table pl_snapshots add column if not exists interest                    numeric(12,2) default 0;
alter table pl_snapshots add column if not exists depreciation                numeric(12,2) default 0;
alter table pl_snapshots add column if not exists amortization                numeric(12,2) default 0;
alter table pl_snapshots add column if not exists income_taxes                numeric(12,2) default 0;

-- ── invoices: AI categorisation fields ─────────────────────
alter table invoices add column if not exists description            text;
alter table invoices add column if not exists ai_suggested_category  text;
alter table invoices add column if not exists ai_confidence          numeric(5,2);
alter table invoices add column if not exists ai_categorized_at      timestamptz;
alter table invoices add column if not exists review_status          text default 'pending_ai'
  check (review_status in ('pending_ai','pending_review','auto_confirmed','confirmed','corrected'));
alter table invoices add column if not exists reviewed_by            uuid references user_profiles(id);
alter table invoices add column if not exists reviewed_at            timestamptz;
alter table invoices add column if not exists confirmed_category     text;

-- ── RLS: accounting can update invoice review fields ───────
create policy if not exists "accounting_can_review_invoices"
  on invoices for update
  using (get_user_role() in ('board','accounting'))
  with check (get_user_role() in ('board','accounting'));

-- ── Index for review queue ──────────────────────────────────
create index if not exists idx_invoices_review_status
  on invoices (review_status) where is_archived = false;

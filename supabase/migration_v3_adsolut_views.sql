-- Migration v3 — role-gated wrappers over the validated adsolut.* views.
-- APPLIED to Supabase 2026-07-08 (migrations dashboard_pl_wrapper_views +
-- dashboard_pl_wrappers_is_revenue). Kept here for the record.
--
-- Security model:
--   * The adsolut schema is NOT in the PostgREST exposed schemas — these
--     public wrappers are the only API path to the P&L data.
--   * Role gating happens IN the views (get_user_role() on the caller's
--     JWT), not in the UI. Managers get zero rows until the phase-2
--     clause is added (see comment in pl_venue).
--   * Amounts are straight sums of the validated views at year grain —
--     no mapping logic lives here or in the app.

CREATE VIEW public.pl_entity AS
SELECT dossier_code, calendar_year, usali_department, usali_line,
       (account_nr LIKE '7%') AS is_revenue,
       sum(amount)::numeric(14,2) AS amount
FROM adsolut.v_pnl_group
WHERE public.get_user_role() IN ('board','accounting')
GROUP BY dossier_code, calendar_year, usali_department, usali_line, (account_nr LIKE '7%');

CREATE VIEW public.pl_venue AS
SELECT dossier_code, calendar_year, venue, usali_department, usali_line,
       (account_nr LIKE '7%') AS is_revenue,
       sum(amount)::numeric(14,2) AS amount
FROM adsolut.v_pnl_venue
WHERE public.get_user_role() IN ('board','accounting')
-- phase 2 (design approved, NOT built): OR (get_user_role() = 'manager'
--   AND (dossier_code, venue) IN (SELECT dossier_code, venue
--        FROM public.user_venue_access WHERE user_id = auth.uid())
--   AND usali_department NOT IN ('Non-Operating','Management Fees'))
GROUP BY dossier_code, calendar_year, venue, usali_department, usali_line, (account_nr LIKE '7%');

CREATE VIEW public.pl_hotel AS
SELECT dossier_code, calendar_year, block, department, line_label, caveat,
       sum(amount)::numeric(14,2) AS amount
FROM adsolut.v_pnl_hotel
WHERE public.get_user_role() IN ('board','accounting')
GROUP BY dossier_code, calendar_year, block, department, line_label, caveat;

REVOKE ALL ON public.pl_entity, public.pl_venue, public.pl_hotel FROM anon;
GRANT SELECT ON public.pl_entity, public.pl_venue, public.pl_hotel TO authenticated;

-- ============================================================================
-- ADDENDUM (2026-07-08, applied directly — recorded here):
-- * Wrappers now read year-grain MATERIALIZED views adsolut.mv_pl_entity/
--   mv_pl_venue/mv_pl_hotel (live aggregation exceeded the API statement
--   timeout). Refreshed nightly by cgroup-adsolut-sync/sync.py after load.
-- * is_revenue (v3) = account 7x AND usali_department IN ('F&B','UNMAPPED'):
--   payroll offsets net into Labour, non-operating income into Non-Operating.
--   "Omzet" is OPERATING revenue by design (differs from statutory 7x —
--   see cgroup-adsolut-sync/DATA_QUESTIONS.md).
-- * pl_hotel carries labour_split_source from adsolut.entity_labour_source.
-- * Role-gated drill RPCs: public.pl_line_invoices(dossier, department,
--   line, year) and public.pl_invoice_lines(dossier, doc_id) — chain:
--   usali_mapping -> blboekhpl -> bllever -> ubl_documents/ubl_lines.
-- * Honesty guard companion: public.check_view_honesty().
-- Supabase migration names: dashboard_pl_wrapper_views,
-- dashboard_pl_wrappers_is_revenue, check_view_honesty_rpc,
-- invoice_drilldown_rpcs (+ direct DDL for matviews/indexes).

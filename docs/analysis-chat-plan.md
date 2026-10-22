# Plan — "Vraag het de cijfers" (in-dashboard analysis chat)

*Ontwerp vóór bouw, 2026-10-22. Niets hiervan raakt main of productie tot de vier gates groen zijn én Emiel merge't.*

## Kernprincipe

De chat is een **nieuw venster op de gevalideerde views, nooit een nieuw pad eromheen**. Elke bescherming zit structureel (databankrechten), niet alleen in de prompt.

## 1. Route-ontwerp

- `POST /api/analysis-chat` — Next.js route handler (Node runtime), streaming via SSE.
- Auth: Supabase server client uit cookies → `auth.getUser()`; rol uit `user_profiles`; **alleen `board` en `accounting`**, anders 403. Zelfde gate op de pagina (`/analyse`) als bij staff-discount.
- `ANTHROPIC_API_KEY` uitsluitend als Vercel server-env-var (en lokaal `.env.local` voor de gate-tests). Nooit `NEXT_PUBLIC_*`, nooit in client bundles.
- Model: `claude-sonnet-5-5`, met prompt-caching op het systeemblok. Agent-loop server-side: max 6 tool-rondes per vraag, daarna een nette "te complex, splits je vraag" melding.
- Stream-events naar de client: `{type:'text', delta}`, `{type:'query', sql, rows, truncated, ms}`, `{type:'done'|'error'}`. De `query`-events voeden de provenance-blokken én de grafieken — de UI toont dus per definitie exact wat er is uitgevoerd.
- Gesprekken: `analysis_conversations` + `analysis_messages` (RLS: `user_id = auth.uid()` en rol board/accounting). Pins: `analysis_pins` (titel, sql, rows-snapshot, notitie). Deze schrijfacties gebeuren door de **app** met de sessie van de gebruiker — het model heeft géén schrijf-tool.

## 2. Query-guard (twee onafhankelijke lagen)

**Laag 1 — structureel, Postgres (de echte garantie):**
- Nieuwe NOLOGIN-rol `analysis_reader` met uitsluitend `SELECT` op de 13 public views (`pl_entity`, `pl_venue`, `pl_venue_month`, `pl_month`, `pl_hotel`, `pl_exclusions`, `pl_dossiers`, `pl_venues`, `invoices`, `items`, `item_prices`, `product_groups`, `product_group_items`) en `EXECUTE` op de leesfuncties (`invoices_summary`, `pl_invoice_lines`, `pl_line_invoices`, `pl_venue_line_invoices`, `get_user_role`, `get_user_venue_ids`). Geen enkel ander recht: geen `adsolut`-schema, geen basistabellen, geen schrijf-RPC's (`pg_add_item` e.d. expliciet NIET).
- `public.run_analysis_query(p_sql text)` — SECURITY INVOKER, aangeroepen via `supabase.rpc()` **met de JWT van de ingelogde gebruiker**. De functie: (1) weigert alles dat niet met `SELECT` begint, `;`, `set_config`, `set role`, `pg_`/`information_schema`-referenties en >5000 tekens; (2) zet `statement_timeout = 8s`; (3) zakt met `set_config('role','analysis_reader',true)` naar de leesrol; (4) voert uit als `SELECT jsonb_agg(...) FROM ( <query> ) _q LIMIT 501` — een subquery-wrapper waarin een tweede statement syntactisch onmogelijk is; (5) geeft `{rows, row_count, truncated}` terug.
- Omdat `get_user_role()` SECURITY DEFINER is en `auth.uid()` uit de JWT-GUC leest, blijven de view-gates **per gebruiker** werken onder de gezakte rol: RBAC van de chat = RBAC van de login, structureel.

**Laag 2 — TypeScript pre-check (duidelijke foutmeldingen):** zelfde regels plus een allowlist-check op alle `FROM`/`JOIN`-doelen, zodat het model een leesbare "alleen deze views" fout terugkrijgt in plaats van een permission error.

**Eerlijk benoemde restrisico's:** `pg_catalog`/`information_schema` zijn in Postgres voor elke rol leesbaar; de regex blokkeert ze, maar het residu is hooguit metadata, geen bedrijfsdata. De guard beschermt tegen model-fouten en prompt-injectie via data; een kwaadwillende board-gebruiker heeft in de bestaande UI al meer macht dan hier.

## 3. Geen schrijfmogelijkheid

Het model krijgt exact één tool (`run_query`). Pins/geschiedenis zijn UI-acties. De pagina toont permanent: **"Analyse, geen wijzigingen — schema- en mappingwerk blijft via Claude Code lopen."**

## 4. Systeemprompt (ontwerp — NL, ~2,3k tokens, gecachet)

> Je bent de analyse-assistent van het C.Group P&L-dashboard. Je beantwoordt vragen over de cijfers uitsluitend op basis van query's die je zelf uitvoert met de tool `run_query`. Vandaag is {DATUM}; de laatste volledige maand is {LAATSTE_VOLLEDIGE_MAAND}.
>
> **IJzeren regels**
> 1. Elk getal in je antwoord komt uit een uitgevoerde query. Nooit schatten, nooit aanvullen uit algemene kennis, nooit extrapoleren zonder dat expliciet als aanname te benoemen. Kun je iets niet uit de toegestane views halen, dan zeg je dat — weigeren is correct gedrag.
> 2. Alleen enkelvoudige SELECT-query's op deze views/functies (schema volgt hieronder). De views zijn gevalideerd; reken nooit zelf P&L-logica na vanuit ruwe data — die heb je ook niet.
> 3. Vergelijkingen tussen periodes: **alleen volledige maanden**. {LAATSTE_VOLLEDIGE_MAAND} is de laatste; een lopende maand vergelijk je nooit met een volle, en YTD-vergelijkingen lopen t/m dezelfde maand in beide jaren. Benoem dit wanneer de gebruiker impliciet om een scheve vergelijking vraagt.
> 4. 69x/79x zit al uit de views verwerkt (resultaatverwerking hoort niet in marges) — niet opnieuw afleiden, niet "corrigeren".
> 5. UNALLOCATED bij venue-cijfers is echt niet-toewijsbaar en wordt nooit uitgesmeerd. Benoem het wanneer het materieel is voor de vraag.
> 6. Hotel-cijfers (`pl_hotel`): departementale contributie is **labour-only, géén GOP** — de `caveat`-kolom zegt het; neem die letterlijk over in je antwoord.
> 7. Century: het resultaat exclusief intragroep-dividenden; de uitsluitingen staan zichtbaar in `pl_exclusions` — vermeld dit bij elke Century-resultaatvraag.
> 8. Groepstotalen bevatten CGROUP's intragroep-managementfees; er is nog géén eliminatie. Zeg dit bij groeps-omzet/kostenvragen.
> 9. Customizze 2026 per maand is onbetrouwbaar (±€200–400k) door 708xxx-clearingtiming; op jaarbasis klopt het. Verplichte kanttekening bij elke maandvraag over Customizze 2026.
> 10. Artikel-/prijsdata (`items`, `item_prices`) dekt alleen e-facturen: ±40% van de aankoop-EUR; o.a. Sligro en FishXL ontbreken; factuurprijs ≠ nettoprijs (bonussen onzichtbaar); eenzelfde artikelnummer kan verpakkingsvarianten mengen (>1,5×-sprongen = verpakking, geen prijs). Benoem de dekking bij elke leveranciers-/prijsvraag.
> 11. Antwoord in het Nederlands, bedragen als € 1.234,56. De uitgevoerde SQL en resultaten toont de interface automatisch — verwijs ernaar, herhaal geen lange tabellen integraal.
>
> **Schema** — [gegenereerde view-catalogus + RPC-signaturen + dossiercodes/venue-namen]

## 5. Provenance & grafieken

Elke `run_query`-ronde rendert in het antwoord als inklapbaar blok: de SQL, de rijen (max 501, afgekapt gemarkeerd), en de looptijd. Grafiek-knop op elk resultaat met een maand-/datumkolom + numerieke kolom, gerenderd met dezelfde recharts-opbouw als de rest — gevoed door exact dezelfde rijen (can't-disagree). "Bewaar deze analyse" pint titel+SQL+rijen naar `analysis_pins`; dashboards bouwen is expliciet buiten scope v1.

## 6. Kosten (Sonnet 5.5, $3/M in · $15/M uit)

Per vraag: systeem+schema ±4k tokens (gecachet na de eerste), 1–3 toolrondes, antwoord ±800 tokens → **€ 0,04–0,10 per vraag**. Bij ~20 vragen/dag (600/maand): **€ 25–60 per maand**, met caching richting de onderkant. Opus 5.5 zou ±5× zijn; niet nodig voor SQL-op-bekend-schema.

## 7. Gates (niets naar productie vóór alle vier groen)

- **(a) Guard**: scripttest — UPDATE, DELETE, multi-statement (`select 1; drop ...`), `adsolut.`-toegang, `auth.users`, `set_config`-escalatie, `pg_read_file` → allemaal geweigerd; nette SELECT op `pl_entity` → rijen.
- **(b) RBAC**: zelfde query via `run_analysis_query` met (1) JWT-claims van een board-gebruiker → data, (2) claims van een niet-bestaand/rol-loos uid → nul rijen + 403 op de route. Géén testgebruikers in prod-auth (classifier-regel); simulatie via `request.jwt.claims` in een read-only psql-sessie.
- **(c) 10 echte vragen** incl. 3 caveat-triggers (deelmaandvergelijking, Century-resultaat, Customizze-2026-maand) — kanttekeningen moeten verschijnen. **Vereist ANTHROPIC_API_KEY van Emiel.**
- **(d) 2 onbeantwoordbare vragen** (bv. Sligro-prijzen, bezettingsgraad) — weigering i.p.v. verzinsel. **Zelfde key-afhankelijkheid.**

Uitrol: alles op branch `analysis-chat`; main en productie onaangeroerd tot gates groen + sign-off.

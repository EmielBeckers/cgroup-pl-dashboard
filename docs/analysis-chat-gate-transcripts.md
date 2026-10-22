# Gate (c)+(d) transcripts — 2026-10-22T13:59Z, model claude-sonnet-5-5, laatste volledige maand 2026-09
board-uid gevonden: ja


## c1

**Vraag:** Wat was de omzet per entiteit in 2025?

> **bronquery** (9 rijen):
> `SELECT dossier_code, SUM(amount) AS omzet FROM pl_entity WHERE calendar_year = 2025 AND is_revenue GROUP BY dossier_code ORDER BY omzet DESC`
> rijen: `[{"omzet":11500910.01,"dossier_code":"CUSTOMIZZE"},{"omzet":10920498.48,"dossier_code":"GREENVALLEY"},{"omzet":7762524.2,"dossier_code":"COUTDOOR"},{"omzet":7597070.55,"dossier_code":"BLUEOCEAN"},{"omzet":6553600.28,"dossier_code":"CENTURY"},{"omzet":6320271.14,"dossier_code":"CCORDA"},{"omzet":6103781.29,"dossier_code`

Omzet per entiteit in 2025 (exclusief btw, volledig jaar):

- Customizze: € 11.500.910,01
- GreenValley: € 10.920.498,48
- COutdoor: € 7.762.524,20
- BlueOcean: € 7.597.070,55
- Century: € 6.553.600,28
- CCorda: € 6.320.271,14
- HasHotel: € 6.103.781,29
- MiaMensa: € 3.521.502,27
- CGroup: € 2.051.105,14

Kanttekeningen:
- **Intragroep-managementfees:** de omzet van CGroup bestaat grotendeels uit intragroep-managementfees. Er is nog geen eliminatie, dus de som van alle entiteiten is geen zuivere groepsomzet. Ik heb die som daarom niet berekend. De fees staan ook als kosten bij de andere entiteiten.
- **Century:** het resultaat van Century is exclusief intragroep-dividenden. Die staan zichtbaar in pl_exclusions. Dit geldt voor het resultaat, niet voor de omzet hierboven.
- **Customizze:** dit cijfer is een jaartotaal en daarop is Customizze betrouwbaar. Per maand zou het in 2026 niet kloppen, door de timing van de 708xxx-clearing.



## c2

**Vraag:** Hoe evolueert de F&B-omzet van Blue Ocean in 2026 per maand?

> **bronquery** (9 rijen):
> `select month, amount from pl_month where dossier_code='BLUEOCEAN' and calendar_year=2026 and is_revenue order by month`
> rijen: `[{"month":"2026-01-01","amount":549714.36},{"month":"2026-02-01","amount":504546.78},{"month":"2026-03-01","amount":579981.72},{"month":"2026-04-01","amount":669816.49},{"month":"2026-05-01","amount":684804.47},{"month":"2026-06-01","amount":674928.78},{"month":"2026-07-01","amount":766797.62},{"month":"2026-08-01","am`

> **bronquery** (7 rijen):
> `select usali_department, usali_line, sum(amount) amount from pl_entity where dossier_code='BLUEOCEAN' and calendar_year=2026 and is_revenue group by 1,2 order by 3 desc`
> rijen: `[{"amount":3532075.22,"usali_line":"Food Revenue","usali_department":"F&B"},{"amount":1631063.93,"usali_line":"Beverage Revenue (21% VAT = mostly drinks)","usali_department":"F&B"},{"amount":52130.59,"usali_line":"Beverage Revenue","usali_department":"F&B"},{"amount":4973,"usali_line":"Revenue — POS ticket clearing (ne`

Blue Ocean heeft in 2026 alleen F&B-omzet, dus de maandomzet uit `pl_month` is de F&B-omzet. Een uitsplitsing per maand naar F&B-lijn (food of beverage) bestaat niet in de views. Die uitsplitsing is er alleen per jaar.

Omzet per maand:
- jan: € 549.714,36
- feb: € 504.546,78
- mrt: € 579.981,72
- apr: € 669.816,49
- mei: € 684.804,47
- jun: € 674.928,78
- jul: € 766.797,62
- aug: € 779.965,90
- sep: € 4.973,00

Verloop:
- **Februari:** dip ten opzichte van januari.
- **Maart–april:** sterke stijging, van ca. € 580k naar ca. € 670k.
- **April–juni:** vlak, rond € 670–685k.
- **Juli en augustus:** de hoogste maanden, tot € 779.965,90 in augustus. Dat is ca. 42% boven januari.

September (€ 4.973,00) is geen echte omzetdaling. Het bedrag is precies de boekingslijn "POS ticket clearing (nets ~0)", en er staat geen food- of beverage-omzet op. September lijkt dus nog niet geboekt of ingeladen, ook al is het de laatste volle maand. Uit de views kan ik de oorzaak niet afleiden. Ik zou september daarom niet in een vergelijking of trend meenemen tot dit is nagekeken.

De jaaromzet t/m september is € 5.215.529,12. Daarvan is € 3.532.075,22 food en € 1.683.194,52 beverage (beide beverage-lijnen samen). Daarnaast staat er € 4.973,00 aan POS-clearing en ongeveer € -4.713,62 aan allowances (foutieve tickets en commerciële kortingen).



## c3 CAVEAT deelmaand

**Vraag:** Vergelijk de groepsomzet van oktober 2026 met oktober 2025.

> **query geweigerd (guard):** `select calendar_year, dossier_code, sum(amount) as omzet from pl_month where is_revenue and extract(month from month) <=` — "month" is geen toegestane view. Toegestaan: pl_entity, pl_venue, pl_venue_month, pl_month, pl_hotel, pl_exclusions, pl_dossiers, pl_venues, invoices, items, item_prices, product_groups, product_group_items, invoices_summary, pl_invoice_lines, pl_line_invoices, pl_venue_line_invoices

> **query geweigerd (guard):** `select month, sum(amount) as omzet, count(distinct dossier_code) as entiteiten from pl_month where is_revenue and extrac` — "month" is geen toegestane view. Toegestaan: pl_entity, pl_venue, pl_venue_month, pl_month, pl_hotel, pl_exclusions, pl_dossiers, pl_venues, invoices, items, item_prices, product_groups, product_group_items, invoices_summary, pl_invoice_lines, pl_line_invoices, pl_venue_line_invoices

> **bronquery** (18 rijen):
> `select calendar_year, dossier_code, sum(amount) as omzet from pl_month where is_revenue and ((month >= '2025-01-01' and month <= '2025-09-01') or (month >= '2026-01-01' and month <= '2026-09-01')) group by calendar_year,`
> rijen: `[{"omzet":5646435.7,"dossier_code":"BLUEOCEAN","calendar_year":2025},{"omzet":5215529.12,"dossier_code":"BLUEOCEAN","calendar_year":2026},{"omzet":4570064.25,"dossier_code":"CCORDA","calendar_year":2025},{"omzet":4216137.44,"dossier_code":"CCORDA","calendar_year":2026},{"omzet":4782388.76,"dossier_code":"CENTURY","cale`

> **bronquery** (3 rijen):
> `select month, sum(amount) as omzet, count(distinct dossier_code) as entiteiten from pl_month where is_revenue and month in ('2025-10-01','2026-10-01','2025-09-01','2026-09-01') group by month order by month`
> rijen: `[{"month":"2025-09-01","omzet":5535394.49,"entiteiten":9},{"month":"2025-10-01","omzet":4728622.8,"entiteiten":9},{"month":"2026-09-01","omzet":521034.85,"entiteiten":7}]`

> **bronquery** (9 rijen):
> `select month, count(distinct dossier_code) as entiteiten, sum(amount) as omzet from pl_month where is_revenue and month >= '2026-01-01' group by month order by month`
> rijen: `[{"month":"2026-01-01","omzet":4258502.55,"entiteiten":9},{"month":"2026-02-01","omzet":4194957.51,"entiteiten":9},{"month":"2026-03-01","omzet":4794308.11,"entiteiten":9},{"month":"2026-04-01","omzet":4950443.77,"entiteiten":9},{"month":"2026-05-01","omzet":5516524.89,"entiteiten":9},{"month":"2026-06-01","omzet":5900`

> **bronquery** (7 rijen):
> `select dossier_code, amount from pl_month where is_revenue and month = '2026-09-01' order by dossier_code`
> rijen: `[{"amount":4973,"dossier_code":"BLUEOCEAN"},{"amount":29166.59,"dossier_code":"CCORDA"},{"amount":73477.81,"dossier_code":"CGROUP"},{"amount":2471.47,"dossier_code":"COUTDOOR"},{"amount":401415.44,"dossier_code":"CUSTOMIZZE"},{"amount":8963.44,"dossier_code":"GREENVALLEY"},{"amount":567.1,"dossier_code":"MIAMENSA"}]`

> **bronquery** (2 rijen):
> `select calendar_year, sum(amount) as omzet, count(distinct month) as maanden from pl_month where is_revenue and ((month >= '2025-01-01' and month <= '2025-08-01') or (month >= '2026-01-01' and month <= '2026-08-01')) gro`
> rijen: `[{"omzet":41606702.68,"maanden":8,"calendar_year":2025},{"omzet":41385476.55,"maanden":8,"calendar_year":2026}]`

Ik kan oktober 2026 niet vergelijken met oktober 2025. De cijfers van de laatste maanden zijn ook niet bruikbaar voor een volledige vergelijking.

**Waarom niet**
- Oktober 2026 is een lopende maand. De laatste volledige maand is september 2026, en een lopende maand vergelijk ik niet met een volle maand. In `pl_month` staat voor oktober 2026 bovendien nog geen omzet. Oktober 2025 staat er wel in: € 4.728.622,80, over 9 entiteiten.
- Ook september 2026 lijkt nog niet volledig verwerkt. De groepsomzet is € 521.034,85 over 7 entiteiten, tegen € 5.535.394,49 over 9 entiteiten in september 2025. CENTURY en HASHOTEL ontbreken helemaal. De meeste andere entiteiten staan op een paar duizend euro. Alleen CUSTOMIZZE (€ 401.415,44) en CGROUP (€ 73.477,81) hebben een substantieel bedrag.
- Die cijfers voor september zijn daarom geen echte omzetdaling. Ze zijn waarschijnlijk nog niet volledig geboekt. Dit zou ik laten nakijken voordat je september of een YTD t/m september gebruikt.

**Eerlijke variant: YTD januari t/m augustus, beide jaren**
- 2025: € 41.606.702,68
- 2026: € 41.385.476,55
- Het verschil is € 221.226,13 lager in 2026, ongeveer 0,5%.

**Kanttekeningen**
- De groepstotalen bevatten de intragroep-managementfees van CGROUP. Er is nog geen eliminatie, dus de omzet is deels dubbel geteld.
- CUSTOMIZZE per maand in 2026 is onbetrouwbaar. Door de timing van de 708xxx-clearing schommelt het ±€ 200-400k per maand. Op jaarbasis klopt het wel. Dit speelt ook bij het bedrag voor september.
- Omdat CENTURY in de cijfers zit: het resultaat is exclusief intragroep-dividenden, die staan in `pl_exclusions`. Dat raakt de omzet niet.

Zodra oktober 2026 volledig is afgesloten en september is aangevuld, kan ik de maandvergelijking opnieuw draaien.



## c4 CAVEAT Century

**Vraag:** Hoeveel winst maakte Century in 2025?

> **bronquery** (2 rijen):
> `select is_revenue, sum(amount) amount from pl_entity where dossier_code='CENTURY' and calendar_year=2025 group by is_revenue`
> rijen: `[{"amount":-6563502.93,"is_revenue":false},{"amount":6553600.28,"is_revenue":true}]`

> **bronquery** (1 rijen):
> `select account_nr, label, amount from pl_exclusions where dossier_code='CENTURY' and calendar_year=2025`
> rijen: `[{"label":"Dividend income — intragroup, excluded from P&L","amount":1400000,"account_nr":"750000"}]`

Century maakte in 2025 geen winst. Het resultaat was een klein verlies van € 9.902,65.

- Omzet: € 6.553.600,28
- Kosten: € 6.563.502,93
- Resultaat: omzet min kosten = € -9.902,65

Dit resultaat is exclusief intragroep-dividenden. In `pl_exclusions` staat voor 2025 een dividendopbrengst van € 1.400.000,00 (rekening 750000, intragroep). Die is bewust buiten de P&L gehouden. Als je dat dividend wel meetelt, komt het totaal hoger uit. Het is dan wel een intragroepspost en geen operationele winst.



## c5 CAVEAT Customizze

**Vraag:** Wat was het resultaat van Customizze in juli 2026?

> **bronquery** (10 rijen):
> `select month, is_revenue, sum(amount) as amount from pl_month where dossier_code='CUSTOMIZZE' and month between '2026-05-01' and '2026-09-01' group by month, is_revenue order by month, is_revenue`
> rijen: `[{"month":"2026-05-01","amount":-878371.22,"is_revenue":false},{"month":"2026-05-01","amount":794526.08,"is_revenue":true},{"month":"2026-06-01","amount":-1134055.59,"is_revenue":false},{"month":"2026-06-01","amount":1444354.43,"is_revenue":true},{"month":"2026-07-01","amount":-870477.23,"is_revenue":false},{"month":"2`

Het resultaat van Customizze in juli 2026 was **€ 79.553,97**.

- Omzet: € 950.031,20
- Kosten: € 870.477,23

**Kanttekening:** Customizze 2026 per maand is onbetrouwbaar. De maandcijfers kunnen ongeveer €200-400k schommelen door de timing van de 708xxx-clearing. Op jaarbasis klopt het wel. Gebruik dit maandresultaat dus niet als zelfstandige indicatie van de prestaties in juli. Voor een betrouwbaar beeld kun je het beste naar het jaartotaal kijken.



## c6

**Vraag:** Wat is de GOP van Has Hotel in 2025?

> **bronquery** (20 rijen):
> `select block, department, line_label, caveat, labour_split_source, amount from pl_hotel where dossier_code='HASHOTEL' and calendar_year=2025 order by block, department, line_label`
> rijen: `[{"block":"LABOUR","amount":-1315799.03,"caveat":"Departmental contribution (labour only): non-labour direct costs (linen, amenities, commissions) are undistributed — NOT departmental profit / GOP.","department":"F&B","line_label":"Labour — F&B","labour_split_source":"blanpla_dept"},{"block":"LABOUR","amount":-693493.2`

> **bronquery** (120 rijen):
> `select usali_department, usali_line, is_revenue, amount from pl_entity where dossier_code='HASHOTEL' and calendar_year=2025 order by is_revenue desc, usali_department, usali_line`
> rijen: `[{"amount":1524782.58,"is_revenue":true,"usali_line":"Beverage Revenue (21% VAT = mostly drinks)","usali_department":"F&B"},{"amount":27.73,"is_revenue":true,"usali_line":"Beverage Revenue (6% VAT)","usali_department":"F&B"},{"amount":7366.34,"is_revenue":true,"usali_line":"Beverage Revenue (arrangements via hotel)","u`

Ik kan u geen gevalideerde GOP voor Has Hotel over 2025 geven. Geen van de toegestane views levert die, en ik reken er zelf geen samen uit losse lijnen.

In `pl_hotel` is de departementale contributie alleen op arbeid gebaseerd. De caveat daarbij luidt letterlijk: *"Departmental contribution (labour only): non-labour direct costs (linen, amenities, commissions) are undistributed — NOT departmental profit / GOP."*

Dit staat er wel voor 2025, allemaal exclusief btw:
- **Rooms:** omzet € 1.763.650,77 en arbeid € -693.493,24.
- **F&B:** omzet restaurant € 3.822.375,42 en omzet ontbijt € 389.590,87. De arbeid is € -1.315.799,03.
- **Overige gedistribueerde omzet:** Function/Meeting (zaalhuur) € 32.384,33 en Other operated € 74.145,76 (misc.) plus € 12.704,65 (parking). Voor deze afdelingen staat geen arbeid in de view.
- **Undistributed:** "Other operating costs" is € -3.108.575,42. Hierin zitten onder meer linnen, OTA-commissies en energie.
- **Non-operating:** afschrijvingen € -625.785,81 en managementfee € -86.747,88.

Een echte GOP vraagt een toewijzing van de niet-arbeidsgebonden directe kosten en van de undistributed kosten. Die toewijzing zit niet in de views. Als u een eigen definitie wilt gebruiken, bijvoorbeeld omzet min alle operationele kosten vóór afschrijvingen en managementfee, dan moet die als aanname worden vastgelegd. Dat valt buiten wat ik als gevalideerd cijfer kan leveren.



## c7

**Vraag:** Wie zijn de vijf grootste leveranciers van de groep in 2026?

> **bronquery** (10 rijen):
> `SELECT leveranc_code, supplier, COUNT(*) AS n_facturen, SUM(total_incl_vat) AS totaal_incl_btw, MIN(invoice_date) AS eerste, MAX(invoice_date) AS laatste FROM invoices WHERE invoice_date >= '2026-01-01' AND invoice_date `
> rijen: `[{"eerste":"2026-01-03","laatste":"2026-10-21","supplier":"Sd Worx Vzw","n_facturen":739,"leveranc_code":"000828","totaal_incl_btw":7442812.44},{"eerste":"2026-01-02","laatste":"2026-10-17","supplier":"Bidfood Horeca Service","n_facturen":1118,"leveranc_code":"000113","totaal_incl_btw":4901550.08},{"eerste":"2026-01-08`

> **bronquery** (12 rijen):
> `SELECT lower(regexp_replace(supplier,'\s+(nv|bvba|vzw|bv|sa|sprl|cvba)\.?$','','i')) AS leverancier_norm, COUNT(*) AS n_facturen, COUNT(DISTINCT leveranc_code) AS n_codes, COUNT(DISTINCT dossier_code) AS n_dossiers, stri`
> rijen: `[{"namen":"SD WORX | Sd Worx Vzw","n_codes":4,"dossiers":"BLUEOCEAN,CCORDA,CENTURY,CGROUP,COUTDOOR,CUSTOMIZZE,HASHOTEL,MIAMENSA","n_dossiers":8,"n_facturen":1337,"totaal_incl_btw":12342910.8,"leverancier_norm":"sd worx"},{"namen":"Bidfood Horeca Service | Bidfood Horeca Service Nv","n_codes":3,"dossiers":"CCORDA,CENTUR`

Op basis van alle aankoopfacturen met factuurdatum van 1 januari t/m 21 oktober 2026 (2026 loopt nog) is dit de top 5 over de hele groep. De bedragen zijn **inclusief btw**.

1. SD Worx: € 12.342.910,80 (1.337 facturen, 8 dossiers)
2. Bidfood Horeca Service: € 7.348.458,29 (1.610 facturen, 7 dossiers)
3. Century Bv/Bvba: € 3.727.161,78 (355 facturen, 8 dossiers)
4. Depot 30 Nv: € 3.362.294,16 (1.418 facturen, 8 dossiers)
5. Bidfood Bestfood Nv: € 2.893.759,53 (517 facturen, BLUEOCEAN en CUSTOMIZZE)

Let op bij de interpretatie:
- **Eén leverancier onder meerdere codes:** de `leveranc_code` verschilt per dossier. Daarom heb ik zelf op leveranciersnaam samengevoegd, na het weglaten van rechtsvormen. Die groepering is mijn aanname.
- **SD Worx:** ik heb "SD WORX" en "Sd Worx Vzw" samengevoegd. "Sd Worx Sociaal Secretariaat Vzw" staat apart, met € 2.503.420,45 (alleen GREENVALLEY). Als dat dezelfde partij is, wordt SD Worx € 14.846.331,25 en blijft de volgorde van de top 3 gelijk. Bestfood zakt dan niet uit de top 5, want de nummer 6 is dan Vitamientje met € 2.271.779,04.
- **Bidfood:** Horeca Service en Bestfood staan apart. Samen zijn ze € 10.242.217,82. Dan zou Bidfood nummer 2 blijven, met Depot 30 daarachter.
- **Waarschijnlijk intragroep:** Century Bv/Bvba staat in de lijst, en daarachter volgen C. Corda Bvba (€ 2.221.546,07) en C. Group Bv/Bvba (€ 2.077.451,41). De namen komen overeen met groepsentiteiten, maar dat kan ik uit de views niet met zekerheid vaststellen. Als je ze als intragroep uitsluit, bestaat de top 5 uit SD Worx, Bidfood Horeca Service, Depot 30, Bidfood Bestfood en SD Worx Sociaal Secretariaat (als aparte partij geteld).
- **Dekking:** deze lijst komt uit de tabel `invoices`, dus uit alle aankoopfacturen. De beperking tot elektronische facturen (±40% van de aankoop-EUR) geldt alleen voor artikel- en prijsdata.
- **Btw:** deze bedragen zijn incl. btw en niet vergelijkbaar met de P&L-bedragen, die exclusief btw zijn.



## c8

**Vraag:** Hoeveel geven we per maand uit aan Bidfood in 2026, en stijgt dat?

> **bronquery** (81 rijen):
> `SELECT date_trunc('month', invoice_date)::date AS maand, dossier_code, count(*) AS n_facturen, sum(total_incl_vat) AS totaal_incl_btw FROM invoices WHERE supplier ILIKE '%bidfood%' AND invoice_date >= '2026-01-01' GROUP `
> rijen: `[{"maand":"2026-01-01","n_facturen":20,"dossier_code":"BLUEOCEAN","totaal_incl_btw":99545.72},{"maand":"2026-01-01","n_facturen":43,"dossier_code":"CCORDA","totaal_incl_btw":267080.63},{"maand":"2026-01-01","n_facturen":15,"dossier_code":"CENTURY","totaal_incl_btw":91337.24},{"maand":"2026-01-01","n_facturen":62,"dossi`

> **bronquery** (10 rijen):
> `SELECT date_trunc('month', invoice_date)::date AS maand, count(*) AS n_facturen, sum(total_incl_vat) AS totaal_incl_btw, string_agg(DISTINCT supplier, ' | ') AS leveranciersnamen FROM invoices WHERE supplier ILIKE '%bidf`
> rijen: `[{"maand":"2026-01-01","n_facturen":224,"totaal_incl_btw":1001550.01,"leveranciersnamen":"Bidfood Bestfood Nv | Bidfood Horeca Service | Bidfood Horeca Service Nv"},{"maand":"2026-02-01","n_facturen":205,"totaal_incl_btw":1104336.87,"leveranciersnamen":"Bidfood Bestfood Nv | Bidfood Horeca Service | Bidfood Horeca Serv`

Bidfood-inkopen lopen in 2026 tussen ongeveer € 0,97 en € 1,31 miljoen per maand. Er zit een lichte stijging in, maar geen duidelijke trend. Het zijn totalen over alle entiteiten, op basis van factuurdatum.

Bedragen per maand (inclusief btw):
- jan: € 1.001.550,01
- feb: € 1.104.336,87
- mrt: € 1.034.460,90
- apr: € 969.021,49
- mei: € 976.461,64
- jun: € 1.118.838,04
- jul: € 1.312.849,04
- aug: € 1.072.193,78
- sep: € 1.049.861,05

**Stijgt het?**
- Januari t/m september is het verloop golvend. Het dal ligt in april en mei, daarna loopt het op naar een piek in juli.
- Van januari naar september is het € 48.311,04 hoger. De maanden daartussen schommelen sterker dan dat verschil.
- De juli-piek komt grotendeels door CUSTOMIZZE: € 382.275,99 in juli, tegen € 89.146,84 in januari en € 177.391,58 in september. Dat is gemeten op facturen, niet op P&L-boekingen. De maandonbetrouwbaarheid van Customizze in de P&L (clearingtiming) speelt hier dus niet.
- Februari bevat twee CGROUP-facturen van samen € 107.921,82. Zonder die facturen is februari € 996.415,05, dus lager dan januari.
- Oktober is een lopende maand (€ 602.645,00 tot nu toe) en laat ik buiten de vergelijking. Dat bedrag is niet vergelijkbaar met een volle maand.

**Kanttekeningen**
- De bedragen zijn inclusief btw. P&L-bedragen zijn exclusief btw, dus tel ze niet bij elkaar op.
- De bedragen komen uit de factuurtabel, die alle aankoopfacturen bevat. Artikel- en prijsdata dekken alleen elektronische facturen, ongeveer 40% van de aankoop-euro's. Bidfood zit daar pas vanaf februari 2026 in. Een uitsplitsing naar artikel of prijsontwikkeling kan ik daarom niet betrouwbaar geven.
- De drie leveranciersnamen (Bidfood Bestfood Nv, Bidfood Horeca Service en Bidfood Horeca Service Nv) heb ik samengenomen.

Ik kan het ook per entiteit uitsplitsen. Dan zie je welke entiteiten de schommelingen veroorzaken.



## c9

**Vraag:** Welke venue van Blue Ocean draait in 2026 de meeste omzet, en hoeveel zit er in UNALLOCATED?

> **bronquery** (3 rijen):
> `select venue, sum(amount) as omzet from pl_venue where dossier_code='BLUEOCEAN' and calendar_year=2026 and is_revenue group by venue order by omzet desc`
> rijen: `[{"omzet":4355154.28,"venue":"MAISONMATHIS"},{"omzet":860374.84,"venue":"TRENTANOVE"},{"omzet":0,"venue":"UNALLOCATED"}]`

> **bronquery** (1 rijen):
> `select min(month) as eerste, max(month) as laatste, count(distinct month) as maanden from pl_venue_month where dossier_code='BLUEOCEAN' and calendar_year=2026`
> rijen: `[{"eerste":"2026-01-01","laatste":"2026-12-01","maanden":10}]`

> **bronquery** (10 rijen):
> `select month, sum(case when is_revenue then amount else 0 end) as omzet, sum(case when not is_revenue then amount else 0 end) as kosten from pl_venue_month where dossier_code='BLUEOCEAN' and calendar_year=2026 group by m`
> rijen: `[{"month":"2026-01-01","omzet":549714.36,"kosten":-660459.22},{"month":"2026-02-01","omzet":504546.78,"kosten":-326051.77},{"month":"2026-03-01","omzet":579981.72,"kosten":-518170.67},{"month":"2026-04-01","omzet":669816.49,"kosten":-596036.78},{"month":"2026-05-01","omzet":684804.47,"kosten":-595498.33},{"month":"2026`

> **bronquery** (3 rijen):
> `select venue, sum(case when is_revenue then amount else 0 end) as omzet, sum(case when not is_revenue then amount else 0 end) as kosten from pl_venue where dossier_code='BLUEOCEAN' and calendar_year=2026 group by venue o`
> rijen: `[{"omzet":4355154.28,"venue":"MAISONMATHIS","kosten":-3723585.15},{"omzet":860374.84,"venue":"TRENTANOVE","kosten":-752362.32},{"omzet":0,"venue":"UNALLOCATED","kosten":-326923.87}]`

**Maison Mathis** heeft in 2026 de meeste omzet bij Blue Ocean: € 4.355.154,28. Dat is ongeveer 83,5% van de omzet van Blue Ocean (€ 5.215.529,12).

- **Trentanove:** € 860.374,84 omzet.
- **UNALLOCATED:** € 0,00 omzet. Er staan wel kosten in UNALLOCATED: € 326.923,87. Dat zijn echt niet-toewijsbare kosten. Ik heb ze niet over de venues verdeeld.

Voor de omzetcijfers geldt ook dit:
- **September 2026:** de omzet is maar € 4.973,00, tegen € 500.000–780.000 in de andere maanden. De kosten zijn ook laag (€ 136.215,10). Dat lijkt op een onvolledige boeking. Het totaal voor 2026 kan daardoor te laag zijn, maar dat kan ik uit de views niet vaststellen.
- **December 2026:** er staat een maand met € 149.777,91 kosten en geen omzet, terwijl we pas op 22 oktober zijn. Het is niet duidelijk wat dit is. Het zit wel in de jaartotalen.

De omzet per venue is daarom een stand van januari t/m september plus deze afwijkende boekingen. De verhouding tussen de venues blijft duidelijk, maar je kunt de bedragen niet als jaarcijfer lezen.



## c10

**Vraag:** Wat is de personeelskost als percentage van de omzet per entiteit in 2026, tot en met september?

> **bronquery** (256 rijen):
> `select usali_department, usali_line, is_revenue, count(*) n, sum(amount) amt from pl_entity where calendar_year=2026 group by 1,2,3 order by 1,2`
> rijen: `[{"n":3,"amt":603718.75,"is_revenue":true,"usali_line":"Beverage Revenue","usali_department":"F&B"},{"n":5,"amt":6191175.38,"is_revenue":true,"usali_line":"Beverage Revenue (21% VAT = mostly drinks)","usali_department":"F&B"},{"n":3,"amt":79.06,"is_revenue":true,"usali_line":"Beverage Revenue (6% VAT)","usali_departmen`

> **bronquery** (9 rijen):
> `select dossier_code, min(month) mn, max(month) mx, count(distinct month) n from pl_month where calendar_year=2026 group by 1`
> rijen: `[{"n":10,"mn":"2026-01-01","mx":"2026-12-01","dossier_code":"BLUEOCEAN"},{"n":10,"mn":"2026-01-01","mx":"2026-12-01","dossier_code":"CCORDA"},{"n":11,"mn":"2026-01-01","mx":"2026-12-01","dossier_code":"CENTURY"},{"n":10,"mn":"2026-01-01","mx":"2026-12-01","dossier_code":"CGROUP"},{"n":10,"mn":"2026-01-01","mx":"2026-12`

> **bronquery** (11 rijen):
> `select month, count(distinct dossier_code) ents, sum(case when is_revenue then amount end) rev, sum(case when not is_revenue then amount end) cost from pl_month where calendar_year=2026 group by 1 order by 1`
> rijen: `[{"rev":4258502.55,"cost":-4801124.05,"ents":9,"month":"2026-01-01"},{"rev":4194957.51,"cost":-3099938.34,"ents":9,"month":"2026-02-01"},{"rev":4794308.11,"cost":-4163480.08,"ents":9,"month":"2026-03-01"},{"rev":4950443.77,"cost":-4390563.66,"ents":9,"month":"2026-04-01"},{"rev":5516524.89,"cost":-4621408.68,"ents":9,"`

> **bronquery** (9 rijen):
> `with e as (select dossier_code, sum(case when is_revenue then amount else 0 end) rev, sum(case when not is_revenue then amount else 0 end) cost, sum(case when usali_department='Payroll & Related' then amount else 0 end) `
> rijen: `[{"rev":5215529.12,"cost":-4802871.34,"m_rev":5215529.12,"m_cost":-4802871.34,"payroll":-2236727.98,"rev_ytd9":5215529.12,"dossier_code":"BLUEOCEAN","cost_after_sep":-149777.91},{"rev":4216137.44,"cost":-4156194.76,"m_rev":4216137.44,"m_cost":-4156194.76,"payroll":-1540649.55,"rev_ytd9":4216137.44,"dossier_code":"CCORD`

> **bronquery** (9 rijen):
> `select dossier_code, round(sum(case when is_revenue then amount else 0 end),2) omzet, round(-sum(case when usali_department='Payroll & Related' then amount else 0 end),2) personeelskost, round(100*-sum(case when usali_de`
> rijen: `[{"pct":42.9,"omzet":5215529.12,"dossier_code":"BLUEOCEAN","omzet_unmapped":0,"personeelskost":2236727.98},{"pct":39.4,"omzet":4513990.42,"dossier_code":"CENTURY","omzet_unmapped":0,"personeelskost":1776268.28},{"pct":37.1,"omzet":3790582.47,"dossier_code":"HASHOTEL","omzet_unmapped":0,"personeelskost":1407367.06},{"pc`

Personeelskost (department "Payroll & Related") als percentage van de omzet, 2026 per entiteit, hoog naar laag:

- BLUEOCEAN: 42,9% (€ 2.236.727,98 op € 5.215.529,12 omzet)
- CENTURY: 39,4% (€ 1.776.268,28 op € 4.513.990,42)
- HASHOTEL: 37,1% (€ 1.407.367,06 op € 3.790.582,47)
- CCORDA: 36,5% (€ 1.540.649,55 op € 4.216.137,44)
- MIAMENSA: 35,5% (€ 835.178,14 op € 2.352.061,69)
- CUSTOMIZZE: 32,8% (€ 2.479.238,07 op € 7.561.175,75)
- GREENVALLEY: 31,7% (€ 2.422.663,28 op € 7.651.497,62)
- COUTDOOR: 29,2% (€ 1.600.000,92 op € 5.478.049,82)
- CGROUP: niet zinvol. Er is geen personeelskost geboekt. De omzet van € 1.127.487,07 staat volledig op "UNMAPPED" en bestaat grotendeels uit intragroep-managementfees. Daar is nog geen eliminatie voor.

Kanttekeningen:
- **Periode:** de views splitsen personeelskost niet per maand, dus "tot en met september" kan ik niet exact afbakenen. De omzet is wel volledig t/m september, want er is geen omzet na september geboekt. In pl_month staan echter ook kosten van oktober (€ 69) en december (€ 961.706,68) 2026, samen ongeveer € 1,0 miljoen over alle entiteiten. De personeelskost hierboven komt uit pl_entity voor heel 2026 en kan dus een deel van die latere boekingen bevatten. Ik kan niet nagaan hoeveel dat voor personeel is.
- **September:** de omzet van september is laag (€ 521.034,85, tegen € 6.023.415,59 in augustus). Die maand lijkt dus nog niet volledig geboekt. Dat drukt de omzet en maakt de percentages iets hoger dan ze met een volle maand zouden zijn.
- **Wat erin zit:** "Payroll & Related" omvat lonen, RSZ, interim- en extra bedieningspersoneel, vakantiegeldprovisie (dotatie en vrijval), opleidingen en overige personeelskosten.
- **Customizze:** het percentage is een cumulatief cijfer over het hele jaar. Per maand zijn de Customizze-cijfers in 2026 onbetrouwbaar (schommelingen van ±€ 200-400k door 708xxx-clearingtiming), dus vergelijk dit niet maand op maand.
- **Overig:** CCORDA heeft € 4.527,78 omzet op "UNMAPPED". Dat is te klein om het percentage te verschuiven. Voor de andere entiteiten (op GREENVALLEY na, met € -12,17) staat er niets op UNMAPPED.



## d1 ONBEANTWOORDBAAR

**Vraag:** Wat betalen we bij Sligro voor frieten?

> **bronquery** (0 rijen):
> `select supplier_name, count(*) n, min(last_date) mn, max(last_date) mx from items where supplier_name ilike '%sligro%' group by supplier_name`
> rijen: `[]`

> **bronquery** (3 rijen):
> `select supplier, count(*) n_facturen, sum(total_incl_vat) totaal_incl_btw, min(invoice_date) eerste, max(invoice_date) laatste from invoices where supplier ilike '%sligro%' group by supplier`
> rijen: `[{"eerste":"2024-09-07","laatste":"2026-01-12","supplier":"Sligro België Nv","n_facturen":1010,"totaal_incl_btw":1845856.18},{"eerste":"2024-07-01","laatste":"2024-08-05","supplier":"Sligro Food Group Belgium Nv","n_facturen":2,"totaal_incl_btw":301.12},{"eerste":"2024-07-05","laatste":"2026-07-17","supplier":"Sligro-M`

Dat kan ik niet uit de cijfers halen. Sligro heeft geen artikel- of prijsdata in het systeem.

- De artikeldata (items/item_prices) komt alleen uit elektronische facturen. Die dekken ±40% van de aankoop-EUR. Sligro ontbreekt daarin volledig: mijn query op de artikeltabel gaf 0 rijen. Ik kan dus geen frietprijs per kg of per verpakking geven. Elke prijs die ik noem, zou verzonnen zijn.
- Facturen van Sligro bestaan wel, maar alleen als totaalbedrag per factuur, inclusief btw, zonder regels. De bedragen per leverancier zijn:
  - Sligro België Nv: 1.010 facturen, € 1.845.856,18 incl. btw (2024-09-07 t/m 2026-01-12).
  - Sligro-Mfs Belgium Nv: 472 facturen, € 62.374,78 incl. btw (2024-07-05 t/m 2026-07-17).
  - Sligro Food Group Belgium Nv: 2 facturen, € 301,12 incl. btw (juli–augustus 2024).
  
  Hieruit is niet af te leiden wat er voor frieten is betaald.

Mogelijke vervolgstappen:
- Kijk op de papieren of pdf-facturen van Sligro. Die zijn te vinden via `pdf_doc_id` in `invoices`.
- Voor een structurele prijsvergelijking op Sligro-artikelen moet de factuurregeldata eerst worden ingelezen. Dat valt buiten deze analyse-interface en loopt via het reguliere Claude Code-traject.
- Ik kan wel de aankoopbedragen van Sligro per entiteit of periode laten zien, als dat helpt. Dat zijn bedragen incl. btw en dus niet direct vergelijkbaar met P&L-cijfers, die exclusief btw zijn.



## d2 ONBEANTWOORDBAAR

**Vraag:** Wat was de bezettingsgraad van Has Hotel vorige maand?

> **bronquery** (5 rijen):
> `select distinct block, department, line_label from pl_hotel where dossier_code='HASHOTEL' and (line_label ilike '%bezet%' or line_label ilike '%occup%' or line_label ilike '%kamer%' or line_label ilike '%room%' or line_l`
> rijen: `[{"block":"REVENUE","department":"Function/Meeting","line_label":"Function revenue — room hire"},{"block":"LABOUR","department":"Rooms","line_label":"Labour — Rooms"},{"block":"REVENUE","department":"Rooms","line_label":"Rooms revenue"},{"block":"REVENUE","department":"Rooms","line_label":"Rooms allowances (Wonderbox)"`

Ik kan de bezettingsgraad van Has Hotel over september 2026 niet geven. Die staat niet in de toegestane views.

Ik heb de hotelweergave (`pl_hotel`) voor HASHOTEL doorzocht op bezetting, kamers en nachten. De weergave bevat alleen financiële regels. Voorbeelden zijn "Rooms revenue", "Rooms allowances (Wonderbox)" en "Labour — Rooms". Aantallen verkochte kamernachten of beschikbare kamers staan er niet in. Zonder die aantallen kan ik geen bezettingsgraad berekenen. Schatten uit de omzet zou een verzonnen getal opleveren, en dat doe ik niet.

Ik kan wel de kamer-omzet (Rooms revenue) van september 2026 laten zien, of de departementale hotelcijfers voor Rooms. Bij die cijfers neem ik de caveat letterlijk over: de departementale contributie is labour-only en geen GOP. De bezettingsgraad zelf moet uit het PMS of de hotelrapportage van het hotel komen.


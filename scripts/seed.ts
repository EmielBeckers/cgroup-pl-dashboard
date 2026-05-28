/**
 * C.Group P&L Dashboard — Mock Data Seed Script v2
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ── MASTER DATA ───────────────────────────────────────────────────────────────

const COMPANIES = [
  { adsolut_id: 'f1195bc0-9eb3-43f8-9106-1e2211e9b64c', name: 'C.Group', display_name: 'C.Group', vat: 'BE0888246717' },
  { adsolut_id: 'cc71a9c5-54ad-4d7e-a8e0-f429dcf370d0', name: 'C. Construx', display_name: 'C. Construx', vat: 'BE0832673635' },
  { adsolut_id: '86122b8b-ed6b-4e3a-9485-2b063ed47a70', name: 'Century', display_name: 'Century', vat: 'BE0432276243' },
  { adsolut_id: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'Green Valley Hospitality', display_name: 'Green Valley', vat: 'BE0762770683' },
  { adsolut_id: '86133332-ba53-473e-84fb-01ad70d173de', name: 'Blue Ocean Hospitality', display_name: 'Blue Ocean', vat: 'BE0737641844' },
  { adsolut_id: 'a15dd588-cdbd-45ea-8f5a-671d54f1b465', name: 'R&R FIN', display_name: 'R&R FIN', vat: 'BE0738952235' },
  { adsolut_id: 'f29982fb-160c-4b3a-8b17-553f5ad5f331', name: 'Customizze', display_name: 'Customizze', vat: 'BE0739578577' },
  { adsolut_id: '6a99ee7f-6078-46d1-a60c-cdf0361e686c', name: 'Mia Mensa', display_name: 'Mia Mensa', vat: 'BE0702979388' },
  { adsolut_id: '2efefa26-ab20-41fb-af3d-478af6652bbb', name: 'C. Corda', display_name: 'C. Corda', vat: 'BE0559919236' },
  { adsolut_id: 'ef5902d1-0e2d-46a0-ba3b-cfccbc32752a', name: 'HasHotel', display_name: 'HasHotel', vat: 'BE0464301980' },
  { adsolut_id: 'a3fc8e8b-7700-4304-be22-d7ae565dab04', name: 'C. Outdoor', display_name: 'C. Outdoor', vat: 'BE0831615741' },
]

const VENUE_DEFS = [
  // HasHotel
  { companyAdsolutId: 'ef5902d1-0e2d-46a0-ba3b-cfccbc32752a', name: 'HASHOTEL',         type: 'hotel'      as const, pos: 'trivec'     as const, baseRevenue: 180000, isHotel: true  },
  { companyAdsolutId: 'ef5902d1-0e2d-46a0-ba3b-cfccbc32752a', name: 'BRAGOÛT',           type: 'restaurant' as const, pos: 'lightspeed' as const, baseRevenue:  85000, isHotel: false },
  // Century
  { companyAdsolutId: '86122b8b-ed6b-4e3a-9485-2b063ed47a70', name: 'THE CENTURY',       type: 'hotel'      as const, pos: 'trivec'     as const, baseRevenue: 220000, isHotel: true  },
  // Mia Mensa
  { companyAdsolutId: '6a99ee7f-6078-46d1-a60c-cdf0361e686c', name: 'MIA MENSA',         type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  55000, isHotel: false },
  // C. Corda
  { companyAdsolutId: '2efefa26-ab20-41fb-af3d-478af6652bbb', name: 'HET CORDAAT',       type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  70000, isHotel: false },
  { companyAdsolutId: '2efefa26-ab20-41fb-af3d-478af6652bbb', name: 'CORDA.BAR',         type: 'bar'        as const, pos: 'trivec'     as const, baseRevenue:  42000, isHotel: false },
  { companyAdsolutId: '2efefa26-ab20-41fb-af3d-478af6652bbb', name: 'CORDA.CUISINE',     type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  95000, isHotel: false },
  // Green Valley Hospitality
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'ODIEL BISTRONOMIE', type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  78000, isHotel: false },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'ATELIER V',         type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  62000, isHotel: false },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'TRENTANOVE',        type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue: 105000, isHotel: false },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'MAISON MATHIS',     type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue: 118000, isHotel: false },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'TERLAND',           type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  52000, isHotel: false },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'VANHARTE',          type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  68000, isHotel: false },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'DE COMMANDEUR',     type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  74000, isHotel: false },
  // Blue Ocean Hospitality
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'C.BAR',             type: 'bar'        as const, pos: 'trivec'     as const, baseRevenue:  58000, isHotel: false },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'BAR BOUFFE JESSA',  type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  48000, isHotel: false },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'BAR BOUFFE ZOL',    type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  45000, isHotel: false },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'BAR BOUFFE ST-BARBARA', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue:  40000, isHotel: false },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'BAR BOUFFE ZMK',    type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  38000, isHotel: false },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'BAR BOUFFE TRUDO',  type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  42000, isHotel: false },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: "THE ALLEY'S",       type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue:  72000, isHotel: false },
  // C. Outdoor
  { companyAdsolutId: 'a3fc8e8b-7700-4304-be22-d7ae565dab04', name: 'PLAGE ODETTE',      type: 'restaurant' as const, pos: 'trivec'     as const, baseRevenue: 120000, isHotel: false },
]

const SEASON: Record<number, number> = {
  1: 0.74, 2: 0.80, 3: 0.90,
  4: 0.95, 5: 1.02, 6: 1.08,
  7: 1.05, 8: 0.98, 9: 1.05,
  10: 1.00, 11: 1.06, 12: 1.22,
}

const PLAGE_SEASON: Record<number, number> = {
  1: 0, 2: 0, 3: 0,
  4: 0.18, 5: 0.52, 6: 0.85,
  7: 1.30, 8: 1.35, 9: 0.72,
  10: 0.20, 11: 0, 12: 0,
}

// Other-expense distribution (shares within the other-expenses pool)
const EXP_DIST: Record<string, number> = {
  exp_cleaning_supplies:  0.045,
  exp_contract_services:  0.090,
  exp_dishwashing:        0.025,
  exp_dues_subscriptions: 0.010,
  exp_equipment_rental:   0.035,
  exp_kitchen_fuel:       0.020,
  exp_kitchen_smallwares: 0.015,
  exp_laundry:            0.065,
  exp_licenses:           0.010,
  exp_linen:              0.055,
  exp_menus:              0.012,
  exp_miscellaneous:      0.018,
  exp_music_entertainment:0.025,
  exp_operating_supplies: 0.055,
  exp_paper_plastics:     0.030,
  exp_postage:            0.005,
  exp_printing:           0.012,
  exp_admin_general:      0.115,
  exp_it_systems:         0.040,
  exp_sales_marketing:    0.070,
  exp_property_maintenance:0.100,
  exp_utilities:          0.150,
  exp_training:           0.018,
  exp_uniform_costs:      0.012,
  exp_uniform_laundry:    0.008,
  exp_glassware:          0.010,
  exp_china:              0.010,
  exp_flatware:           0.008,
  exp_utensils:           0.008,
}

// ── INVOICE TEMPLATES ─────────────────────────────────────────────────────────
// Realistic Belgian suppliers with Dutch descriptions for AI categorisation testing

const INVOICE_TEMPLATES: Array<{ supplier: string; description: string; category: string }> = [
  // Food & beverage
  { supplier: 'Sligro Belgium NV', description: 'Weeklevering verse groenten en kruiden, zuivelproducten', category: 'Cost of Food' },
  { supplier: 'Bidfood België BVBA', description: 'Droogwaren en conserven: pasta, rijst, sauzen in bulk', category: 'Cost of Food' },
  { supplier: 'Metro Cash & Carry Belgium', description: 'Inkoopfactuur: vlees en charcuterie — maandelijks contract', category: 'Cost of Food' },
  { supplier: 'Horeca Totaal BVBA', description: 'Verse vis en zeevruchten: zeebaars, garnalen, tonijn', category: 'Cost of Food' },
  { supplier: 'Brouwerij Martens NV', description: 'Bierlevering: Draft Pils, Tripel en seizoensbrouwen', category: 'Cost of Beverage' },
  { supplier: 'Wijnhandel Moens & Zonen', description: 'Wijnen: Bordeaux AOC, Bourgogne wit, Prosecco DOC', category: 'Cost of Beverage' },
  { supplier: 'Coca-Cola Europacific Partners', description: 'Frisdranken en mixers: cola, tonic, ginger beer', category: 'Cost of Beverage' },
  { supplier: 'Spadel Mineraalwater', description: 'Mineraalwater Spa Rood en Blauw, 24 x 50cl glazen flessen', category: 'Cost of Beverage' },
  { supplier: 'Duvel Moortgat NV', description: 'Speciaalbieren: Duvel, Vedett, Chouffe gemengd assortiment', category: 'Cost of Beverage' },

  // Cleaning
  { supplier: 'Makro Belgium NV', description: 'Reinigingsproducten: javel, vloerreinigers en vaatwasmiddelen', category: 'Cleaning Supplies' },
  { supplier: 'Ecolab Hygiene BVBA', description: 'HACCP-conforme detergenten en ontsmettingsmiddelen keuken', category: 'Cleaning Supplies' },
  { supplier: 'PG&D Cleaning Solutions', description: 'Professionele reinigingsproducten en dispensersysteem', category: 'Cleaning Supplies' },
  { supplier: 'Diversey Belgium NV', description: 'Vaatwas- en glasreinigingsproducten horeca', category: 'Cleaning Supplies' },

  // Linen & laundry
  { supplier: 'Rentex Textielservice', description: 'Wekelijkse wasservicelevering: tafellinnen, keukenhanddoeken en servetten', category: 'Linen' },
  { supplier: 'Beaulinge Linnenservice', description: 'Hotellinnen: bedovertrekken, kussenslopen en badhanddoeken', category: 'Linen' },
  { supplier: 'Mewa Service GmbH Belgium', description: 'Werkkleding en schorten wasprogramma — maandabonnement', category: 'Uniform Laundry' },
  { supplier: 'Alsco Belgium BVBA', description: 'Uniformen en werkkleding huur- en wasservice', category: 'Uniform Laundry' },

  // Utilities
  { supplier: 'Fluvius System Operator', description: 'Elektriciteitsnetwerk en gasdistributie — maandfactuur', category: 'Utilities' },
  { supplier: 'Luminus NV', description: 'Energiecontract elektriciteit professioneel tarief Q1', category: 'Utilities' },
  { supplier: 'Engie Electrabel', description: 'Aardgas professioneel: verwarming en keukenapparatuur', category: 'Utilities' },
  { supplier: 'Proximus NV', description: 'Glasvezel internet, telefonie en TV horeca — maandelijks', category: 'IT Systems' },
  { supplier: 'Telenet Business', description: 'Zakelijk internetpakket met vaste lijn en wifi access points', category: 'IT Systems' },

  // IT & systems
  { supplier: 'Trivec Belgium BVBA', description: 'Kassasysteem licentie en support — maandabonnement', category: 'IT Systems' },
  { supplier: 'Lightspeed Restaurant', description: 'POS-software licentie en cloud back-up service', category: 'IT Systems' },
  { supplier: 'Adsolut Accounting Software', description: 'Boekhoudpakket jaarabonnement en module-updates', category: 'IT Systems' },
  { supplier: 'Microsoft Corporation', description: 'Microsoft 365 Business Premium — 12 licenties', category: 'IT Systems' },

  // Maintenance & repairs
  { supplier: 'Van Marcke Technieken NV', description: 'Preventief onderhoud HVAC-installatie en sanitaire keuring', category: 'Property Maintenance' },
  { supplier: 'Siemens Building Technologies', description: 'Jaarlijks onderhoud branddetectie en koelsystemen', category: 'Property Maintenance' },
  { supplier: 'Electrabel Solutions', description: 'Elektrotechnisch onderhoud: schakelkasten en noodverlichting', category: 'Property Maintenance' },
  { supplier: 'Liftinstallaties Schindler', description: 'Halfjaarlijkse liftinspectie en onderhoudscontract', category: 'Property Maintenance' },
  { supplier: 'Sodexo Facility Services', description: 'Faciliteitsonderhoud terras en buitenruimtes', category: 'Property Maintenance' },

  // Contract services
  { supplier: 'Securitas Belgium NV', description: 'Beveiligingsdienst weekenddagen en nachtelijke bewaking', category: 'Contract Services' },
  { supplier: 'G4S Security Solutions', description: 'Alarmsysteem monitoring en interventiedienst', category: 'Contract Services' },
  { supplier: 'ISS Facility Services', description: 'Externe schoonmaakdienst: dagelijkse reiniging en periodieke diepreiniging', category: 'Contract Services' },
  { supplier: 'Randstad Horeca', description: 'Interim horecapersoneel: kelners en barpersoneel weekenddiensten', category: 'Contract Services' },

  // Marketing & promotions
  { supplier: 'VLAM Agentschap', description: 'Promotiecampagne lokale producten: seizoenskaart advertentie', category: 'Sales & Marketing' },
  { supplier: 'Google Ads Belgium', description: 'Online advertentiebudget: zoekcampagnes en display remarketing', category: 'Sales & Marketing' },
  { supplier: 'Meta Platforms Ireland', description: 'Social media advertenties Facebook en Instagram — maandbudget', category: 'Sales & Marketing' },
  { supplier: 'Grafisch Atelier De Moor', description: 'Drukwerk: menukaarten, flyers en seizoensbrochures', category: 'Printing' },
  { supplier: 'Iens / TheFork Belgium', description: 'Restaurantplatform abonnement en commissie reservaties', category: 'Reservations' },
  { supplier: 'Booking.com BV', description: 'Commissie online kamerboeking platform — maandafrekening', category: 'Reservations' },

  // Admin & general
  { supplier: 'SD Worx HR Services NV', description: 'Loonadministratie en personeelsverwerking — maandelijks', category: 'Admin & General' },
  { supplier: 'Torfs Accountancy BVBA', description: 'Boekhoudkundige diensten en btw-aangiften Q4', category: 'Admin & General' },
  { supplier: 'Belfius Bank NV', description: 'Bankkosten en transactiekosten betaalautomaten', category: 'Admin & General' },
  { supplier: 'Lyreco Office Products', description: 'Kantoorbenodigdheden: papier, pennen, printercartridges', category: 'Admin & General' },
  { supplier: 'Xerox Belgium NV', description: 'Lease en onderhoud multifunctionele printer/scanner', category: 'Admin & General' },
  { supplier: 'DHL Express Belgium', description: 'Expresszendingen en postdiensten zakelijk pakket', category: 'Postage' },
  { supplier: 'Bpost NV', description: 'Bulk mailings en aangetekende zendingen — maandoverzicht', category: 'Postage' },

  // Training
  { supplier: 'Horeca Vorming Vlaanderen', description: 'Sectoropleiding: HACCP hygiënetraining nieuwe medewerkers', category: 'Training' },
  { supplier: 'Syntra Vlaanderen', description: 'Vakopleidingen barista en mixologie — groepstraining', category: 'Training' },

  // Insurance
  { supplier: 'Allianz Benelux NV', description: 'Beroepsaansprakelijkheidsverzekering horeca — jaarlijkse premie', category: 'Insurance' },
  { supplier: 'AXA Belgium NV', description: 'Brand- en bedrijfsschadeverzekering pand en inventaris', category: 'Insurance' },
  { supplier: 'Ethias Verzekeringen', description: 'Arbeidsongevallenverzekering personeel — kwartaalpremie', category: 'Insurance' },

  // Music & entertainment
  { supplier: 'SABAM', description: 'Auteursrechtvergoeding muziek: achtergrondmuziek in zaal', category: 'Music & Entertainment' },
  { supplier: 'Billijke Vergoeding (PlayRight)', description: 'Naburige rechten muziek — halfjaars aangifte', category: 'Music & Entertainment' },

  // Equipment
  { supplier: 'Rational AG Belgium', description: 'Huurkoop combisteamer Rational SCC XS: maandelijkse leaseterm', category: 'Equipment Rental' },
  { supplier: 'Franke Coffee Systems', description: 'Huurcontract espressomachines en onderhoudsabonnement', category: 'Equipment Rental' },
  { supplier: 'Hupfer Grossküchentechnik', description: 'Maandelijkse lease keukenapparatuur: warmhoudvitrine en salamander', category: 'Equipment Rental' },

  // Commissions
  { supplier: 'Expedia Group Media', description: 'Platformcommissie online boekingen hotels — maandafrekening', category: 'Commissions' },
]

// ── HELPERS ───────────────────────────────────────────────────────────────────

function jitter(value: number, pct = 0.06): number {
  return value * (1 + (Math.random() - 0.5) * 2 * pct)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function buildPlRow(
  companyId: string,
  venueId: string | null,
  year: number,
  month: number,
  baseRevenue: number,
  seasonFactor: number,
  isHotel: boolean,
) {
  const totalRev = jitter(baseRevenue * seasonFactor)

  // Revenue split
  let revRooms = 0, revFood = 0, revBev = 0, revOtherOps = 0, revMisc = 0
  if (isHotel) {
    revRooms    = round2(totalRev * jitter(0.50))
    revFood     = round2(totalRev * jitter(0.28))
    revBev      = round2(totalRev * jitter(0.14))
    revOtherOps = round2(totalRev * jitter(0.05))
    revMisc     = round2(Math.max(0, totalRev - revRooms - revFood - revBev - revOtherOps))
  } else {
    revFood     = round2(totalRev * jitter(0.60))
    revBev      = round2(totalRev * jitter(0.32))
    revMisc     = round2(Math.max(0, totalRev - revFood - revBev))
  }

  // Cost of sales
  const cogsRooms   = isHotel ? round2(revRooms * jitter(0.28)) : 0
  const cogsFood    = round2(revFood * jitter(0.30))
  const cogsBev     = round2(revBev  * jitter(0.22))
  const cogsOther   = isHotel ? round2(revOtherOps * jitter(0.35)) : 0

  // Labour (~34% total revenue)
  const totalLabour = totalRev * jitter(0.34)
  const labMgmt     = round2(totalLabour * 0.18)
  const labService  = round2(totalLabour * 0.47)
  const labKitchen  = round2(totalLabour - labMgmt - labService)

  // Other expenses (~22% total revenue), distributed per EXP_DIST
  const expPool = totalRev * jitter(0.22)
  const expCols: Record<string, number> = {}
  for (const [col, share] of Object.entries(EXP_DIST)) {
    expCols[col] = round2(expPool * jitter(share, 0.20))
  }

  // Management fees (2% of revenue)
  const mgmtFees = round2(totalRev * jitter(0.02, 0.10))

  // Non-operating items
  const nonopRent   = round2(totalRev * jitter(0.04))
  const nonopTaxes  = round2(totalRev * jitter(0.005))
  const nonopIns    = round2(totalRev * jitter(0.008))
  const nonopOther  = round2(totalRev * jitter(0.003))

  // IDA
  const interest     = isHotel ? round2(totalRev * jitter(0.015)) : 0
  const depreciation = round2(totalRev * jitter(0.018))
  const amortization = round2(totalRev * jitter(0.004))
  const incomeTaxes  = round2(totalRev * jitter(0.01))

  return {
    company_id:   companyId,
    venue_id:     venueId,
    period_year:  year,
    period_month: month,
    // Revenue
    revenue_rooms:               revRooms,
    revenue_food:                revFood,
    revenue_beverage:            revBev,
    revenue_other_operated_depts: revOtherOps,
    revenue_misc_income:         revMisc,
    revenue_other:               0,
    // COGS
    cogs_rooms:                  cogsRooms,
    cogs_food:                   cogsFood,
    cogs_beverage:               cogsBev,
    cogs_other_operated_depts:   cogsOther,
    // Labour
    labour_management:           labMgmt,
    labour_service:              labService,
    labour_kitchen:              labKitchen,
    // Other expenses
    ...expCols,
    // Zero out the rarely-used columns not in EXP_DIST
    exp_banquet:                 0,
    exp_cluster_services:        0,
    exp_commissions:             0,
    exp_complimentary:           0,
    exp_corporate_office:        0,
    exp_decorations:             0,
    exp_entertainment_inhouse:   0,
    exp_royalty_fees:            0,
    exp_ice:                     0,
    exp_travel_meals:            0,
    exp_travel_other:            0,
    // Legacy overhead (zeroed out — new columns used instead)
    overhead_rent:      0,
    overhead_utilities: 0,
    overhead_marketing: 0,
    overhead_other:     0,
    // Below GOP
    management_fees:    mgmtFees,
    nonop_rent:         nonopRent,
    nonop_taxes:        nonopTaxes,
    nonop_insurance:    nonopIns,
    nonop_other:        nonopOther,
    interest:           interest,
    depreciation:       depreciation,
    amortization:       amortization,
    income_taxes:       incomeTaxes,
    data_source: 'mock' as const,
    refreshed_at: new Date().toISOString(),
  }
}

function buildInvoices(
  companyId: string,
  venueId: string | null,
  year: number,
  month: number,
  count: number,
) {
  const invoices = []
  for (let i = 0; i < count; i++) {
    const template = INVOICE_TEMPLATES[Math.floor(Math.random() * INVOICE_TEMPLATES.length)]
    const day = Math.floor(Math.random() * 28) + 1
    const invoiceDate = new Date(year, month - 1, day)
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + 30)

    const exclVat = round2(Math.random() * 4500 + 300)
    const vatRate = [0.06, 0.12, 0.21][Math.floor(Math.random() * 3)]
    const vatAmt  = round2(exclVat * vatRate)

    const daysAgo = (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    const status: 'paid' | 'pending' | 'overdue' =
      daysAgo > 0 && Math.random() > 0.85 ? 'overdue'
      : daysAgo > 0 ? 'paid'
      : 'pending'

    const num = `INV-${year}${String(month).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`
    invoices.push({
      company_id:            companyId,
      venue_id:              venueId,
      invoice_number:        num,
      invoice_date:          invoiceDate.toISOString().split('T')[0],
      due_date:              dueDate.toISOString().split('T')[0],
      supplier_name:         template.supplier,
      description:           template.description,
      amount_excl_vat:       exclVat,
      vat_amount:            vatAmt,
      amount_incl_vat:       round2(exclVat + vatAmt),
      usali_category:        template.category,
      status,
      pdf_url:               null,
      is_archived:           false,
      // AI fields — seeded as pending so the categorise job can process them
      ai_suggested_category: null,
      ai_confidence:         null,
      ai_categorized_at:     null,
      review_status:         'pending_ai' as const,
      reviewed_by:           null,
      reviewed_at:           null,
      confirmed_category:    null,
    })
  }
  return invoices
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  C.Group mock data seed v2 starting…\n')

  // 1. Insert companies
  console.log('Inserting companies…')
  const { data: insertedCompanies, error: compErr } = await supabase
    .from('companies')
    .upsert(
      COMPANIES.map(c => ({
        adsolut_id:   c.adsolut_id,
        name:         c.name,
        display_name: c.display_name,
        vat_number:   c.vat,
        is_active:    true,
      })),
      { onConflict: 'adsolut_id' },
    )
    .select()

  if (compErr) { console.error('Companies error:', compErr); process.exit(1) }
  console.log(`  ✓  ${insertedCompanies!.length} companies`)

  const companyMap = new Map(insertedCompanies!.map((c: { adsolut_id: string; id: string }) => [c.adsolut_id, c.id]))

  // 2. Insert venues
  console.log('Inserting venues…')
  const venueRows = VENUE_DEFS.map(v => ({
    company_id: companyMap.get(v.companyAdsolutId)!,
    name:       v.name,
    type:       v.type,
    pos_system: v.pos,
    is_active:  true,
  }))

  let venueResult: { name: string; id: string; company_id: string }[] = []

  const { data: upsertedVenues, error: venErr } = await supabase
    .from('venues')
    .upsert(venueRows, { onConflict: 'company_id,name' } as { onConflict: string })
    .select()

  if (venErr) {
    await supabase.from('venues').delete().not('id', 'is', null)
    const { data: iv2, error: e2 } = await supabase.from('venues').insert(venueRows).select()
    if (e2) { console.error('Venues error:', e2); process.exit(1) }
    venueResult = iv2 ?? []
    console.log(`  ✓  ${venueResult.length} venues (fresh insert)`)
  } else {
    venueResult = upsertedVenues ?? []
    console.log(`  ✓  ${venueResult.length} venues`)
  }

  const venueMap = new Map(venueResult.map(v => [`${v.company_id}::${v.name}`, v.id]))

  // 3. Generate P&L snapshots Jan 2024 – May 2026
  const months: Array<{ year: number; month: number }> = []
  for (let y = 2024; y <= 2026; y++) {
    const maxMonth = y === 2026 ? 5 : 12
    for (let m = 1; m <= maxMonth; m++) months.push({ year: y, month: m })
  }

  console.log(`\nGenerating P&L snapshots for ${months.length} months…`)

  const plRows = []
  const invoiceRows = []

  for (const venueDef of VENUE_DEFS) {
    const companyId = companyMap.get(venueDef.companyAdsolutId)!
    const venueId   = venueMap.get(`${companyId}::${venueDef.name}`) ?? null

    for (const { year, month } of months) {
      const isSeasonal = venueDef.name === 'PLAGE ODETTE'
      const sf = isSeasonal ? PLAGE_SEASON[month] : SEASON[month]
      if (sf === 0) continue

      plRows.push(buildPlRow(companyId, venueId, year, month, venueDef.baseRevenue, sf, venueDef.isHotel))

      const invoiceCount = Math.floor(Math.random() * 6) + 3
      invoiceRows.push(...buildInvoices(companyId, venueId, year, month, invoiceCount))
    }
  }

  // Batch upsert P&L snapshots
  console.log(`  Upserting ${plRows.length} P&L rows…`)
  for (let i = 0; i < plRows.length; i += 200) {
    const batch = plRows.slice(i, i + 200)
    const { error } = await supabase
      .from('pl_snapshots')
      .upsert(batch, { onConflict: 'company_id,venue_id,period_year,period_month' } as { onConflict: string })
    if (error) { console.error('P&L batch error:', error); process.exit(1) }
    process.stdout.write(`\r  ✓  ${Math.min(i + 200, plRows.length)} / ${plRows.length}`)
  }
  console.log()

  // Delete existing invoices and re-insert
  console.log(`  Inserting ${invoiceRows.length} invoices…`)
  await supabase.from('invoices').delete().not('id', 'is', null)
  for (let i = 0; i < invoiceRows.length; i += 200) {
    const batch = invoiceRows.slice(i, i + 200)
    const { error } = await supabase.from('invoices').insert(batch)
    if (error) { console.error('Invoice batch error:', error); process.exit(1) }
    process.stdout.write(`\r  ✓  ${Math.min(i + 200, invoiceRows.length)} / ${invoiceRows.length}`)
  }
  console.log()

  console.log('\n✅  Seed complete.')
  console.log('   Companies:', insertedCompanies!.length)
  console.log('   Venues:   ', venueResult.length)
  console.log('   P&L rows: ', plRows.length)
  console.log('   Invoices: ', invoiceRows.length)
}

seed().catch(err => { console.error(err); process.exit(1) })

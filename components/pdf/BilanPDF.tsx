import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Font, Image, Svg, Circle, Path
} from '@react-pdf/renderer'
import type { BilanData, ParametresCabinet, BilanCalculations } from '@/lib/types'
// Use ASCII-only number formatting — Helvetica doesn't support U+202F (narrow no-break space) from fr-FR locale
const fmtEur = (n: number): string => {
  const abs = Math.round(Math.abs(n))
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (n < 0 ? '-' : '') + s + ' €'
}


const C = {
  PARCHMENT: '#F5F4F0',
  WHITE: '#FFFFFF',
  PANEL: '#EFEDE8',
  NAVY_DARK: '#081828',
  NAVY: '#1E4D7A',
  GOLD: '#A8874A',
  GOLD_LIGHT: '#FAF4E8',
  INK: '#242420',
  INK_MEDIUM: '#55554F',
  INK_LIGHT: '#8E8D87',
  BORDER: '#E0DED7',
  POS: '#1E7A4F',
  NEG: '#952033',
}

const s = StyleSheet.create({
  page: { backgroundColor: C.PARCHMENT, paddingHorizontal: 40, paddingVertical: 40, fontFamily: 'Helvetica' },
  coverPage: { backgroundColor: C.NAVY_DARK, paddingHorizontal: 0, paddingVertical: 0 },

  // Header shown on all pages except cover
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.BORDER },
  pageHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageHeaderTitle: { fontSize: 9, color: C.INK_MEDIUM, fontFamily: 'Helvetica' },
  pageNumber: { fontSize: 9, color: C.INK_LIGHT },

  // Section title
  sectionTitle: { fontFamily: 'Helvetica', fontSize: 18, color: C.NAVY_DARK, marginBottom: 16 },
  sectionSubtitle: { fontSize: 10, color: C.INK_MEDIUM, marginBottom: 20, marginTop: -12 },

  // Table
  table: { marginBottom: 12 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: C.BORDER },
  tableRowAlt: { backgroundColor: C.WHITE },
  tableLabel: { flex: 2, fontSize: 10, color: C.INK },
  tableValue: { flex: 1, fontSize: 10, color: C.INK, textAlign: 'right' },
  tableBold: { fontWeight: 600 },
  tableTotal: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, backgroundColor: C.PANEL, borderRadius: 4, marginTop: 4 },

  // Chips / badges
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 9 },

  // KPI cards
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  kpiCard: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1 },
  kpiLabel: { fontSize: 8, marginBottom: 4, textTransform: 'uppercase' },
  kpiValue: { fontSize: 16, fontWeight: 600, fontFamily: 'Helvetica' },
})

// Page header component (shown on all content pages)
function PageHeader({ cabinet, clientName }: { cabinet: ParametresCabinet; clientName: string }) {
  return (
    <View style={s.pageHeader}>
      <View style={s.pageHeaderLeft}>
        <View style={{ width: 16, height: 16, backgroundColor: C.GOLD, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.WHITE, fontSize: 9, fontFamily: 'Helvetica' }}>C</Text>
        </View>
        <Text style={s.pageHeaderTitle}>
          {cabinet.nomCabinet || 'Charlie'} · Bilan Patrimonial · {clientName}
        </Text>
      </View>
      {cabinet.logo ? (
        <Image src={cabinet.logo} style={{ height: 20, maxWidth: 60, objectFit: 'contain' }} />
      ) : (
        <Text style={{ fontSize: 8, color: C.INK_LIGHT }}>{new Date().toLocaleDateString('fr-FR')}</Text>
      )}
    </View>
  )
}

// Cover Page
function CoverPage({ bilan, cabinet }: { bilan: BilanData; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.civilite, bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const conseiller = [cabinet.prenomConseiller, cabinet.nomConseiller].filter(Boolean).join(' ')

  return (
    <Page size="A4" style={s.coverPage}>
      {/* Navy top 60% */}
      <View style={{ backgroundColor: C.NAVY_DARK, flex: 6, paddingHorizontal: 48, paddingVertical: 48, justifyContent: 'space-between' }}>
        {/* Logo area */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 28, height: 28, backgroundColor: C.GOLD, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.WHITE, fontSize: 14, fontFamily: 'Helvetica' }}>C</Text>
          </View>
          {cabinet.logo ? (
            <Image src={cabinet.logo} style={{ height: 28, maxWidth: 100, objectFit: 'contain' }} />
          ) : (
            <View>
              <Text style={{ color: C.WHITE, fontSize: 14, fontFamily: 'Helvetica' }}>{cabinet.nomCabinet || 'Charlie'}</Text>
            </View>
          )}
        </View>

        {/* Title block */}
        <View>
          <Text style={{ fontSize: 9, color: C.GOLD, letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Document confidentiel</Text>
          <Text style={{ fontFamily: 'Helvetica', fontSize: 36, color: C.WHITE, marginBottom: 8, lineHeight: 1.1 }}>Bilan{'\n'}Patrimonial</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>{clientName}</Text>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Etabli le {dateStr}</Text>
          {conseiller && (
            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Conseiller : {conseiller}</Text>
          )}
        </View>
      </View>

      {/* Parchment bottom 40% */}
      <View style={{ backgroundColor: C.PARCHMENT, flex: 4, paddingHorizontal: 48, paddingVertical: 36, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap: 24 }}>
          {cabinet.adresse ? <Text style={{ fontSize: 9, color: C.INK_MEDIUM }}>{cabinet.adresse}</Text> : null}
          {cabinet.telephone ? <Text style={{ fontSize: 9, color: C.INK_MEDIUM }}>{cabinet.telephone}</Text> : null}
          {cabinet.email ? <Text style={{ fontSize: 9, color: C.INK_MEDIUM }}>{cabinet.email}</Text> : null}
        </View>
        {cabinet.numeroOrias && (
          <Text style={{ fontSize: 8, color: C.INK_LIGHT }}>Immatricule ORIAS n° {cabinet.numeroOrias}</Text>
        )}
      </View>
    </Page>
  )
}

// Actif/Passif summary page
function BilanPage({ bilan, calc, cabinet }: { bilan: BilanData; calc: BilanCalculations; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'

  // Pie chart data
  const totalActif = calc.totalActif
  const immoRatio = totalActif > 0 ? calc.totalActifImmobilier / totalActif : 0
  const finRatio = totalActif > 0 ? calc.totalActifFinancier / totalActif : 0
  const proRatio = totalActif > 0 ? calc.totalActifProfessionnel / totalActif : 0

  // Simple pie chart using SVG arcs
  function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  function arc(cx: number, cy: number, r: number, start: number, end: number) {
    if (end - start >= 360) end = 359.99
    const s2 = polarToCartesian(cx, cy, r, start)
    const e = polarToCartesian(cx, cy, r, end)
    const large = end - start > 180 ? 1 : 0
    return `M ${cx} ${cy} L ${s2.x} ${s2.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`
  }

  const segments = [
    { ratio: immoRatio, color: C.NAVY_DARK, label: 'Immobilier', amount: calc.totalActifImmobilier },
    { ratio: finRatio, color: C.GOLD, label: 'Financier', amount: calc.totalActifFinancier },
    { ratio: proRatio, color: C.INK_MEDIUM, label: 'Professionnel', amount: calc.totalActifProfessionnel },
  ].filter(seg => seg.ratio > 0)

  let currentDeg = 0
  const paths = segments.map(seg => {
    const start = currentDeg
    const end = currentDeg + seg.ratio * 360
    currentDeg = end
    return { ...seg, path: arc(50, 50, 40, start, end) }
  })

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} />

      <Text style={s.sectionTitle}>Bilan Actif / Passif</Text>

      {/* KPI row */}
      <View style={s.kpiRow}>
        <View style={{ ...s.kpiCard, backgroundColor: '#EEF4FA', borderColor: '#A8C4DE' }}>
          <Text style={{ ...s.kpiLabel, color: C.NAVY }}>Total Actif</Text>
          <Text style={{ ...s.kpiValue, color: C.NAVY_DARK }}>{fmtEur(calc.totalActif)}</Text>
        </View>
        <View style={{ ...s.kpiCard, backgroundColor: '#FAF2F3', borderColor: '#F4E6E9' }}>
          <Text style={{ ...s.kpiLabel, color: C.NEG }}>Total Passif</Text>
          <Text style={{ ...s.kpiValue, color: C.NEG }}>{fmtEur(calc.totalPassif)}</Text>
        </View>
        <View style={{ ...s.kpiCard, backgroundColor: C.GOLD_LIGHT, borderColor: C.GOLD }}>
          <Text style={{ ...s.kpiLabel, color: C.GOLD }}>Patrimoine Net</Text>
          <Text style={{ ...s.kpiValue, color: C.GOLD }}>{fmtEur(calc.patrimoineNet)}</Text>
        </View>
      </View>

      {/* Actif table */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 11, fontWeight: 600, color: C.NAVY_DARK, marginBottom: 8 }}>ACTIF</Text>
        <View style={s.table}>
          {/* Immobilier */}
          {bilan.actif.immobilier.length > 0 && (
            <>
              <View style={{ ...s.tableRow, backgroundColor: C.PANEL }}>
                <Text style={{ ...s.tableLabel, fontWeight: 600, fontSize: 9, color: C.INK_MEDIUM }}>IMMOBILIER</Text>
                <Text style={{ ...s.tableValue, fontWeight: 600, fontSize: 9, color: C.INK_MEDIUM }}>{fmtEur(calc.totalActifImmobilier)}</Text>
              </View>
              {bilan.actif.immobilier.map((bien, i) => (
                <View key={bien.id} style={{ ...s.tableRow, ...(i % 2 === 0 ? s.tableRowAlt : {}) }}>
                  <Text style={s.tableLabel}>{bien.libelle || bien.type}</Text>
                  <Text style={s.tableValue}>{fmtEur(bien.valeurEstimee)}</Text>
                </View>
              ))}
            </>
          )}
          {/* Financier */}
          {bilan.actif.financier.length > 0 && (
            <>
              <View style={{ ...s.tableRow, backgroundColor: C.PANEL }}>
                <Text style={{ ...s.tableLabel, fontWeight: 600, fontSize: 9, color: C.INK_MEDIUM }}>FINANCIER</Text>
                <Text style={{ ...s.tableValue, fontWeight: 600, fontSize: 9, color: C.INK_MEDIUM }}>{fmtEur(calc.totalActifFinancier)}</Text>
              </View>
              {bilan.actif.financier.map((fin, i) => (
                <View key={fin.id} style={{ ...s.tableRow, ...(i % 2 === 0 ? s.tableRowAlt : {}) }}>
                  <Text style={s.tableLabel}>{fin.libelle || fin.type}{fin.etablissement ? ` - ${fin.etablissement}` : ''}</Text>
                  <Text style={s.tableValue}>{fmtEur(fin.valeur)}</Text>
                </View>
              ))}
            </>
          )}
          {/* Professionnel */}
          {bilan.actif.professionnel.length > 0 && (
            <>
              <View style={{ ...s.tableRow, backgroundColor: C.PANEL }}>
                <Text style={{ ...s.tableLabel, fontWeight: 600, fontSize: 9, color: C.INK_MEDIUM }}>PROFESSIONNEL</Text>
                <Text style={{ ...s.tableValue, fontWeight: 600, fontSize: 9, color: C.INK_MEDIUM }}>{fmtEur(calc.totalActifProfessionnel)}</Text>
              </View>
              {bilan.actif.professionnel.map((pro, i) => (
                <View key={pro.id} style={{ ...s.tableRow, ...(i % 2 === 0 ? s.tableRowAlt : {}) }}>
                  <Text style={s.tableLabel}>{pro.libelle}{pro.pourcentageDetention ? ` (${pro.pourcentageDetention}%)` : ''}</Text>
                  <Text style={s.tableValue}>{fmtEur(pro.valeurEstimee)}</Text>
                </View>
              ))}
            </>
          )}
          <View style={s.tableTotal}>
            <Text style={{ ...s.tableLabel, fontWeight: 600, color: C.NAVY_DARK }}>Total Actif</Text>
            <Text style={{ ...s.tableValue, fontWeight: 600, color: C.NAVY_DARK }}>{fmtEur(calc.totalActif)}</Text>
          </View>
        </View>
      </View>

      {/* Passif table */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 11, fontWeight: 600, color: C.NEG, marginBottom: 8 }}>PASSIF</Text>
        <View style={s.table}>
          {bilan.passif.credits.map((credit, i) => (
            <View key={credit.id} style={{ ...s.tableRow, ...(i % 2 === 0 ? s.tableRowAlt : {}) }}>
              <Text style={s.tableLabel}>{credit.libelle || credit.type}{credit.etablissement ? ` - ${credit.etablissement}` : ''}</Text>
              <Text style={{ ...s.tableValue, color: C.NEG }}>{fmtEur(credit.capitalRestantDu)}</Text>
            </View>
          ))}
          {bilan.passif.autresDettes > 0 && (
            <View style={s.tableRow}>
              <Text style={s.tableLabel}>Autres dettes</Text>
              <Text style={{ ...s.tableValue, color: C.NEG }}>{fmtEur(bilan.passif.autresDettes)}</Text>
            </View>
          )}
          <View style={s.tableTotal}>
            <Text style={{ ...s.tableLabel, fontWeight: 600, color: C.NEG }}>Total Passif</Text>
            <Text style={{ ...s.tableValue, fontWeight: 600, color: C.NEG }}>{fmtEur(calc.totalPassif)}</Text>
          </View>
        </View>
      </View>

      {/* SVG Pie chart — only if we have actif */}
      {paths.length > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <Svg width={100} height={100} viewBox="0 0 100 100">
            {paths.map((p, i) => (
              <Path key={i} d={p.path} fill={p.color} />
            ))}
            <Circle cx={50} cy={50} r={24} fill={C.PARCHMENT} />
          </Svg>
          <View style={{ gap: 5 }}>
            {segments.map((seg, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: seg.color }} />
                <Text style={{ fontSize: 9, color: C.INK_MEDIUM }}>
                  {seg.label} — {fmtEur(seg.amount)} ({Math.round(seg.ratio * 100)} %)
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Page>
  )
}

// Revenus & Fiscalite page
function RevenusPage({ bilan, calc, cabinet }: { bilan: BilanData; calc: BilanCalculations; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const r = bilan.revenusCharges.revenus
  const c = bilan.revenusCharges.charges
  const f = bilan.fiscalite

  const revenusItems = [
    { label: 'Salaires nets', value: r.salaireNet },
    { label: 'BIC / BNC', value: r.bicBnc },
    { label: 'Revenus fonciers', value: r.revenusFonciers },
    { label: 'Dividendes', value: r.dividendes },
    { label: 'Plus-values', value: r.plusValues },
    { label: 'Pensions / retraites', value: r.pensions },
    { label: 'Autres revenus', value: r.autresRevenus },
  ].filter(item => item.value > 0)

  const chargesItems = [
    { label: 'Remboursements credits', value: c.remboursementsCredit },
    { label: 'Charges de copropriete', value: c.chargesCopropriete },
    { label: 'Pension alimentaire', value: c.pensionAlimentaire },
    { label: 'Autres charges fixes', value: c.autresCharges },
  ].filter(item => item.value > 0)

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} />

      <Text style={s.sectionTitle}>Revenus, Charges & Fiscalite</Text>

      {/* Revenus/Charges tables side by side */}
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: 600, color: C.POS, marginBottom: 6 }}>REVENUS ANNUELS</Text>
          {revenusItems.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.BORDER }}>
              <Text style={{ ...s.tableLabel, fontSize: 9 }}>{item.label}</Text>
              <Text style={{ ...s.tableValue, fontSize: 9, color: C.POS }}>{fmtEur(item.value)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', paddingVertical: 6, marginTop: 2 }}>
            <Text style={{ ...s.tableLabel, fontWeight: 600, fontSize: 9 }}>Total annuel</Text>
            <Text style={{ ...s.tableValue, fontWeight: 600, fontSize: 9, color: C.POS }}>{fmtEur(calc.revenusMensuelsTotaux * 12)}</Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: 600, color: C.NEG, marginBottom: 6 }}>CHARGES ANNUELLES</Text>
          {chargesItems.map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.BORDER }}>
              <Text style={{ ...s.tableLabel, fontSize: 9 }}>{item.label}</Text>
              <Text style={{ ...s.tableValue, fontSize: 9, color: C.NEG }}>{fmtEur(item.value)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', paddingVertical: 6, marginTop: 2 }}>
            <Text style={{ ...s.tableLabel, fontWeight: 600, fontSize: 9 }}>Total annuel</Text>
            <Text style={{ ...s.tableValue, fontWeight: 600, fontSize: 9, color: C.NEG }}>{fmtEur(calc.chargesMensuellesTotales * 12)}</Text>
          </View>
        </View>
      </View>

      {/* Capacity summary */}
      <View style={{ backgroundColor: C.PANEL, borderRadius: 8, padding: 12, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 8, color: C.INK_MEDIUM, marginBottom: 3 }}>Capacite d epargne mensuelle</Text>
          <Text style={{ fontSize: 14, fontWeight: 600, color: calc.capaciteEpargneMensuelle >= 0 ? C.POS : C.NEG }}>{fmtEur(calc.capaciteEpargneMensuelle)}</Text>
        </View>
        {calc.tauxEndettement > 0 && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: C.INK_MEDIUM, marginBottom: 3 }}>Taux d endettement</Text>
            <Text style={{ fontSize: 14, fontWeight: 600, color: calc.tauxEndettement > 35 ? C.NEG : C.POS }}>{calc.tauxEndettement.toFixed(1)} %</Text>
          </View>
        )}
      </View>

      {/* Fiscalite */}
      <Text style={{ fontSize: 12, fontWeight: 600, color: C.NAVY_DARK, marginBottom: 10 }}>ANALYSE FISCALE</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1, backgroundColor: '#EEF4FA', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#A8C4DE' }}>
          <Text style={{ fontSize: 8, color: C.NAVY, marginBottom: 4 }}>TMI</Text>
          <Text style={{ fontSize: 20, fontFamily: 'Helvetica', color: C.NAVY_DARK }}>{calc.tmi} %</Text>
          <Text style={{ fontSize: 8, color: C.INK_MEDIUM }}>Tranche marginale d imposition</Text>
        </View>
        {calc.isAssujettisIFI && (
          <View style={{ flex: 1, backgroundColor: '#FAF2F3', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#F4E6E9' }}>
            <Text style={{ fontSize: 8, color: C.NEG, marginBottom: 4 }}>IFI ESTIME</Text>
            <Text style={{ fontSize: 20, fontFamily: 'Helvetica', color: C.NEG }}>{fmtEur(calc.estimationIFI)}</Text>
            <Text style={{ fontSize: 8, color: C.INK_MEDIUM }}>Assujetti a l IFI</Text>
          </View>
        )}
      </View>

      {f.strategieSuccession ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 9, fontWeight: 600, color: C.INK, marginBottom: 4 }}>Strategie de succession</Text>
          <Text style={{ fontSize: 9, color: C.INK_MEDIUM, lineHeight: 1.5 }}>{f.strategieSuccession}</Text>
        </View>
      ) : null}
      {f.observationsFiscales ? (
        <View>
          <Text style={{ fontSize: 9, fontWeight: 600, color: C.INK, marginBottom: 4 }}>Observations fiscales</Text>
          <Text style={{ fontSize: 9, color: C.INK_MEDIUM, lineHeight: 1.5 }}>{f.observationsFiscales}</Text>
        </View>
      ) : null}
    </Page>
  )
}

// Profil Risque + Objectifs page
function ProfilObjectifsPage({ bilan, cabinet }: { bilan: BilanData; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const pr = bilan.profilRisque
  const objectifsSelected = bilan.objectifs.objectifs.filter(o => o.selected)

  const PROFIL_COLORS: Record<string, string> = {
    prudent: C.POS, equilibre: C.GOLD, dynamique: C.NAVY, offensif: C.INK
  }
  const PROFIL_LABELS: Record<string, string> = {
    prudent: 'Prudent', equilibre: 'Equilibre', dynamique: 'Dynamique', offensif: 'Offensif'
  }
  const PRIORITE_COLORS: Record<string, string> = {
    haute: C.NEG, moyenne: C.GOLD, basse: C.INK_LIGHT
  }

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} />

      <Text style={s.sectionTitle}>Profil de Risque & Objectifs</Text>

      {/* Profil risque */}
      {pr.resultat ? (
        <View style={{ backgroundColor: C.PANEL, borderRadius: 8, padding: 14, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: PROFIL_COLORS[pr.resultat] || C.NAVY }}>
          <Text style={{ fontSize: 8, color: C.INK_MEDIUM, marginBottom: 4, textTransform: 'uppercase' }}>Profil MIF2</Text>
          <Text style={{ fontFamily: 'Helvetica', fontSize: 18, color: PROFIL_COLORS[pr.resultat] || C.NAVY_DARK, marginBottom: 6 }}>
            {PROFIL_LABELS[pr.resultat] || pr.resultat}
          </Text>
          <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap' }}>
            {pr.objectif ? <Text style={{ fontSize: 8, color: C.INK_MEDIUM }}>Objectif: {pr.objectif}</Text> : null}
            {pr.horizon ? <Text style={{ fontSize: 8, color: C.INK_MEDIUM }}>Horizon: {pr.horizon.replace('_', ' ')}</Text> : null}
            {pr.experience ? <Text style={{ fontSize: 8, color: C.INK_MEDIUM }}>Experience: {pr.experience}</Text> : null}
          </View>
        </View>
      ) : null}

      {/* Objectifs */}
      {objectifsSelected.length > 0 && (
        <View>
          <Text style={{ fontSize: 10, fontWeight: 600, color: C.NAVY_DARK, marginBottom: 10 }}>OBJECTIFS PATRIMONIAUX</Text>
          <View style={{ gap: 6 }}>
            {objectifsSelected.map((obj) => (
              <View key={obj.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: C.WHITE, borderRadius: 6, borderWidth: 1, borderColor: C.BORDER }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: obj.priorite ? PRIORITE_COLORS[obj.priorite] : C.INK_LIGHT, marginRight: 8 }} />
                <Text style={{ flex: 1, fontSize: 9, color: C.INK }}>{obj.libelle}</Text>
                {obj.priorite ? (
                  <Text style={{ fontSize: 8, color: PRIORITE_COLORS[obj.priorite] || C.INK_LIGHT, fontWeight: 600 }}>
                    {obj.priorite.charAt(0).toUpperCase() + obj.priorite.slice(1)}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      )}

      {bilan.objectifs.commentaires ? (
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 9, fontWeight: 600, color: C.INK, marginBottom: 4 }}>Commentaires client</Text>
          <Text style={{ fontSize: 9, color: C.INK_MEDIUM, lineHeight: 1.5 }}>{bilan.objectifs.commentaires}</Text>
        </View>
      ) : null}
    </Page>
  )
}

// Recommandations + Mentions legales page
function RecommandationsPage({ bilan, cabinet }: { bilan: BilanData; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const conseiller = [cabinet.prenomConseiller, cabinet.nomConseiller].filter(Boolean).join(' ')
  const dateStr = new Date().toLocaleDateString('fr-FR')

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} />

      {bilan.objectifs.recommandations ? (
        <View style={{ marginBottom: 32 }}>
          <Text style={s.sectionTitle}>Recommandations</Text>
          <Text style={{ fontSize: 10, color: C.INK, lineHeight: 1.7 }}>{bilan.objectifs.recommandations}</Text>
        </View>
      ) : null}

      {/* Footer mentions legales */}
      <View style={{ marginTop: 'auto', paddingTop: 24, borderTopWidth: 1, borderTopColor: C.BORDER }}>
        <Text style={{ fontSize: 8, color: C.INK_LIGHT, marginBottom: 4 }}>
          Document etabli le {dateStr}{conseiller ? ` par ${conseiller}` : ''}{cabinet.nomCabinet ? `, ${cabinet.nomCabinet}` : ''}.
        </Text>
        {cabinet.numeroOrias ? (
          <Text style={{ fontSize: 8, color: C.INK_LIGHT, marginBottom: 4 }}>
            Conseiller en Gestion de Patrimoine immatricule a l ORIAS sous le numero {cabinet.numeroOrias} (www.orias.fr).
          </Text>
        ) : null}
        <Text style={{ fontSize: 8, color: C.INK_LIGHT, lineHeight: 1.5 }}>
          {cabinet.mentionsLegales || 'Ce document est etabli a titre informatif. Il ne constitue pas un conseil en investissement au sens de la reglementation MIF2. Les donnees presentees sont issues des informations communiquees par le client et n\'ont pas fait l\'objet d\'une verification independante.'}
        </Text>
      </View>
    </Page>
  )
}

// Main document
export interface BilanPDFProps {
  bilan: BilanData
  cabinet: ParametresCabinet
  calculations: BilanCalculations
}

export function BilanPDF({ bilan, cabinet, calculations }: BilanPDFProps) {
  return (
    <Document
      title={`Bilan Patrimonial - ${bilan.identite.prenom} ${bilan.identite.nom}`}
      author={cabinet.nomCabinet || 'Charlie'}
      creator="Charlie Bilan Patrimonial"
      language="fr"
    >
      <CoverPage bilan={bilan} cabinet={cabinet} />
      <BilanPage bilan={bilan} calc={calculations} cabinet={cabinet} />
      <RevenusPage bilan={bilan} calc={calculations} cabinet={cabinet} />
      <ProfilObjectifsPage bilan={bilan} cabinet={cabinet} />
      <RecommandationsPage bilan={bilan} cabinet={cabinet} />
    </Document>
  )
}

import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, Font, Image, Svg, Circle, Path, Rect, Line
} from '@react-pdf/renderer'
import type { BilanData, ParametresCabinet, BilanCalculations } from '@/lib/types'

// ASCII-only number formatting (Helvetica doesn't support U+202F narrow no-break space)
const fmtEur = (n: number): string => {
  const abs = Math.round(Math.abs(n))
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (n < 0 ? '-' : '') + s + ' €'
}

// ─── Color palette (Mérovée style) ──────────────────────────────────────────
const C = {
  PARCHMENT:   '#EEECEA',   // page background — warm off-white
  PANEL:       '#E4E0D8',   // panels, callout backgrounds
  WHITE:       '#FFFFFF',
  INK:         '#1C1914',   // near-black body text
  INK_MED:     '#4E4A44',   // medium text
  INK_LIGHT:   '#928E88',   // captions, hints
  GOLD:        '#B59048',   // accent gold
  GOLD_LIGHT:  '#F0E8D0',   // very light gold tint
  FOREST:      '#1E3A2F',   // dark green — primary chart color
  FOREST_MED:  '#3A6B50',   // medium green
  BORDER:      '#D2CEC6',   // hairline borders
  BORDER_DARK: '#9A9690',   // thicker rule color
  POS:         '#1A6040',   // positive green
  NEG:         '#B02020',   // negative red
}

// ─── StyleSheet ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.PARCHMENT,
    paddingHorizontal: 44,
    paddingTop: 32,
    paddingBottom: 36,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    backgroundColor: C.PARCHMENT,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },

  // Inner-page header
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 28,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.BORDER_DARK,
  },
  pageHeaderCabinet: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.FOREST,
    letterSpacing: 1.5,
  },
  pageHeaderTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.INK,
    letterSpacing: 0.8,
  },
  pageHeaderSub: {
    fontSize: 7.5,
    color: C.INK_MED,
  },
  pageNumber: {
    fontSize: 8,
    color: C.INK_LIGHT,
  },

  // Section headers
  sectionLabel: {
    fontSize: 8,
    color: C.INK_MED,
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  sectionTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 22,
    color: C.INK,
    lineHeight: 1.15,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: C.INK_MED,
    marginBottom: 18,
    lineHeight: 1.4,
  },

  // Subsection label
  subLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.INK_MED,
    letterSpacing: 1.2,
    marginBottom: 6,
  },

  // Table — hairline only, no fills
  table: { marginBottom: 16 },
  tableHead: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.INK_MED,
  },
  tableHeadCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.INK_MED,
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.BORDER,
  },
  tableRowAlt: {},  // no alternating background
  tableLabel: { flex: 2, fontSize: 9.5, color: C.INK },
  tableValue: { flex: 1, fontSize: 9.5, color: C.INK, textAlign: 'right' },
  tableTotal: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: C.INK_MED,
    marginTop: 2,
  },

  // KPI cards — thin border, no fill
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderWidth: 0.5,
    borderColor: C.BORDER_DARK,
  },
  kpiLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.INK_MED,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  kpiValue: {
    fontFamily: 'Times-Roman',
    fontSize: 19,
    color: C.INK,
    lineHeight: 1,
  },
  kpiSub: { fontSize: 8, color: C.INK_MED, marginTop: 5 },

  // Editorial callout (left gold border)
  callout: {
    borderLeftWidth: 3,
    borderLeftColor: C.GOLD,
    backgroundColor: C.PANEL,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  calloutLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.GOLD,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  calloutText: {
    fontSize: 9.5,
    color: C.INK,
    lineHeight: 1.6,
  },
})

// ─── Inner-page header ────────────────────────────────────────────────────────
function PageHeader({ cabinet, clientName, section, pageNum, totalPages }:
  { cabinet: ParametresCabinet; clientName: string; section?: string; pageNum?: string; totalPages?: string }) {
  return (
    <View style={s.pageHeader}>
      <View style={{ gap: 3 }}>
        <Text style={s.pageHeaderCabinet}>{(cabinet.nomCabinet || 'Charlie').toUpperCase()}</Text>
        {cabinet.logo ? (
          <Image src={cabinet.logo} style={{ height: 14, maxWidth: 60, objectFit: 'contain' }} />
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={s.pageHeaderTitle}>BILAN PATRIMONIAL{section ? ` — ${section}` : ''}</Text>
        <Text style={s.pageHeaderSub}>{clientName}{pageNum ? ` · p. ${pageNum}` : ''}</Text>
      </View>
    </View>
  )
}

// ─── Section heading component ───────────────────────────────────────────────
function SectionHeading({ num, slug, title, subtitle }: {
  num: string; slug: string; title: string; subtitle?: string
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.sectionLabel}>
        <Text style={{ color: C.GOLD }}>{num}</Text>{' · '}{slug.toUpperCase()}
      </Text>
      <Text style={s.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={s.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  )
}

// ─── Cover page ──────────────────────────────────────────────────────────────
function CoverPage({ bilan, cabinet }: { bilan: BilanData; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.civilite, bilan.identite.prenom, bilan.identite.nom]
    .filter(Boolean).join(' ') || 'Client'
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const conseiller = [cabinet.prenomConseiller, cabinet.nomConseiller].filter(Boolean).join(' ')
  const ref = `${(cabinet.nomCabinet || 'CBP').slice(0, 3).toUpperCase()}-${(bilan.identite.nom || 'XX').slice(0, 2).toUpperCase()}-BIL-${new Date().getFullYear()}`

  return (
    <Page size="A4" style={s.coverPage}>
      {/* ── Body ─────────────────────────────────────────── */}
      <View style={{ flex: 1, paddingHorizontal: 56, paddingTop: 52, paddingBottom: 48, justifyContent: 'space-between' }}>

        {/* Cabinet header */}
        <View>
          {cabinet.logo ? (
            <Image src={cabinet.logo} style={{ height: 28, maxWidth: 120, objectFit: 'contain', marginBottom: 6 }} />
          ) : (
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.FOREST, letterSpacing: 2, marginBottom: 4 }}>
              {(cabinet.nomCabinet || 'Charlie').toUpperCase()}
            </Text>
          )}
          {cabinet.adresse ? (
            <Text style={{ fontSize: 8, color: C.INK_MED, letterSpacing: 0.5 }}>
              {cabinet.adresse.toUpperCase()}
            </Text>
          ) : null}
        </View>

        {/* Title block */}
        <View style={{ marginTop: 60 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.INK_MED, letterSpacing: 2, marginBottom: 28 }}>
            RAPPORT CLIENT
          </Text>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 48, color: C.INK, lineHeight: 1.05, marginBottom: 0 }}>
            Bilan
          </Text>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 48, color: C.INK, lineHeight: 1.05 }}>
            patrimonial
          </Text>
          {/* Gold underline */}
          <Svg width={180} height={3} style={{ marginTop: 4, marginBottom: 20 }}>
            <Rect x={0} y={0} width={140} height={1.5} fill={C.GOLD} />
          </Svg>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 13, color: C.INK_MED }}>
            {'É'}tat au {dateStr}
          </Text>
        </View>

        {/* Prepared for */}
        <View style={{ marginTop: 52 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.INK_MED, letterSpacing: 2, marginBottom: 12 }}>
            PR{'É'}PAR{'É'} POUR
          </Text>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 22, color: C.INK, marginBottom: 4 }}>
            {clientName}
          </Text>
          {conseiller ? (
            <Text style={{ fontSize: 9, color: C.INK_MED }}>
              Conseiller : {conseiller}
            </Text>
          ) : null}
        </View>
      </View>

      {/* ── Footer ───────────────────────────────────────── */}
      <View style={{
        borderTopWidth: 0.5, borderTopColor: C.BORDER_DARK,
        paddingHorizontal: 56, paddingVertical: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <View style={{ gap: 3 }}>
          <Text style={{ fontSize: 7.5, color: C.INK_MED }}>R{'é'}f{'é'}rence : {ref}</Text>
          <Text style={{ fontSize: 7.5, color: C.INK_MED }}>Date d{'’'}estimation : {dateStr}</Text>
          {cabinet.numeroOrias ? (
            <Text style={{ fontSize: 7.5, color: C.INK_MED }}>
              Immatricul{'é'} ORIAS n{'°'} {cabinet.numeroOrias}
            </Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.GOLD, letterSpacing: 1.5 }}>
            STRICTEMENT CONFIDENTIEL
          </Text>
          <Text style={{ fontSize: 7.5, color: C.INK_MED }}>Document personnel · Ne pas diffuser</Text>
        </View>
      </View>
    </Page>
  )
}

// ─── Identité & Situation familiale ──────────────────────────────────────────
function IdentitePage({ bilan, cabinet }: { bilan: BilanData; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const ident = bilan.identite
  const fam = bilan.situationFamiliale

  const STATUT_LABELS: Record<string, string> = {
    celibataire: 'Célibataire', marie: 'Marié(e)', pacse: 'Pacsé(e)',
    concubinage: 'Concubinage', divorce: 'Divorçé(e)', veuf: 'Veuf / Veuve',
  }
  const REGIME_LABELS: Record<string, string> = {
    communaute_legale: 'Communauté légale',
    separation_biens: 'Séparation de biens',
    communaute_universelle: 'Communauté universelle',
    participation_acquets: 'Participation aux acquêts',
  }
  const SITPRO_LABELS: Record<string, string> = {
    salarie: 'Salarié', tns: 'TNS', dirigeant: 'Dirigeant',
    retraite: 'Retraité', sans_emploi: 'Sans emploi', autre: 'Autre',
  }

  const identRows: [string, string][] = ([
    ['Civilité', ident.civilite],
    ['Nom', ident.nom],
    ['Prénom', ident.prenom],
    ['Date de naissance', ident.dateNaissance ? new Date(ident.dateNaissance).toLocaleDateString('fr-FR') : ''],
    ['Lieu de naissance', ident.lieuNaissance],
    ['Nationalité', ident.nationalite],
    ['Résidence fiscale', ident.paysResidenceFiscale || 'France'],
    ['Situation professionnelle', ident.situationProfessionnelle ? (SITPRO_LABELS[ident.situationProfessionnelle] || ident.situationProfessionnelle) : ''],
    ['Profession', ident.professionDetaille],
    ['Email', ident.email],
    ['Téléphone', ident.telephone],
  ] as [string, string][]).filter(([, v]) => v && v.length > 0)

  const conjoint = fam.conjoint
  const conjointRows: [string, string][] = conjoint ? ([
    ['Prénom / Nom', `${conjoint.prenom} ${conjoint.nom}`.trim()],
    ['Date de naissance', conjoint.dateNaissance ? new Date(conjoint.dateNaissance).toLocaleDateString('fr-FR') : ''],
    ['Situation pro', conjoint.situationProfessionnelle ? (SITPRO_LABELS[conjoint.situationProfessionnelle] || conjoint.situationProfessionnelle) : ''],
    ['Statut marital', fam.statutMarital ? (STATUT_LABELS[fam.statutMarital] || fam.statutMarital) : ''],
    ['Régime matrimonial', fam.regimeMatrimonial ? (REGIME_LABELS[fam.regimeMatrimonial] || fam.regimeMatrimonial) : ''],
  ] as [string, string][]).filter(([, v]) => v && v.length > 0) : []

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} />
      <SectionHeading num="01" slug="Identité &amp; Situation" title="Identité &amp; Situation personnelle" />

      {/* Informations personnelles */}
      <View style={{ marginBottom: 14 }}>
        <Text style={s.subLabel}>INFORMATIONS PERSONNELLES</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={{ ...s.tableHeadCell, flex: 2 }}>CHAMP</Text>
            <Text style={{ ...s.tableHeadCell, flex: 1, textAlign: 'right' }}>VALEUR</Text>
          </View>
          {identRows.map(([label, value], i) => (
            <View key={i} style={s.tableRow}>
              <Text style={s.tableLabel}>{label}</Text>
              <Text style={s.tableValue}>{value}</Text>
            </View>
          ))}
        </View>
        {ident.isPEP && (
          <View style={{ ...s.callout, borderLeftColor: C.NEG, marginTop: 8 }}>
            <Text style={{ ...s.calloutLabel, color: C.NEG }}>ALERTE PEP</Text>
            <Text style={s.calloutText}>{ident.descriptionPEP || 'Personne Politiquement Exposée'}</Text>
          </View>
        )}
      </View>

      {/* Conjoint */}
      {conjoint && conjointRows.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <Text style={s.subLabel}>CONJOINT / PARTENAIRE</Text>
          <View style={s.table}>
            {conjointRows.map(([label, value], i) => (
              <View key={i} style={s.tableRow}>
                <Text style={s.tableLabel}>{label}</Text>
                <Text style={s.tableValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Enfants */}
      {fam.enfants.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <Text style={s.subLabel}>COMPOSITION DU FOYER</Text>
          <View style={s.table}>
            {fam.enfants.map((e, i) => (
              <View key={e.id} style={s.tableRow}>
                <Text style={s.tableLabel}>{e.prenom || `Enfant ${i + 1}`}</Text>
                <Text style={s.tableValue}>{e.age} ans — {e.aCharge ? 'à charge' : 'non à charge'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Donations */}
      {fam.donations.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <Text style={s.subLabel}>DONATIONS ANTÉRIEURES</Text>
          {fam.donations.map((don, i) => {
            const donTypeLabel: Record<string, string> = {
              manuel: 'Donation manuelle', assurance_vie: 'Via assurance-vie',
              demembrement: 'Démembrement', autre: 'Autre',
            }
            return (
              <Text key={i} style={{ fontSize: 9.5, color: C.INK, marginBottom: 4, lineHeight: 1.4 }}>
                {donTypeLabel[don.type] || don.type} — {fmtEur(don.montant)} à {don.beneficiaire}
                {don.date ? ` (${new Date(don.date).toLocaleDateString('fr-FR')})` : ''}
              </Text>
            )
          })}
        </View>
      )}

      {/* Testament */}
      {fam.hasTestament && (
        <View style={{ marginBottom: 8 }}>
          <Text style={s.subLabel}>TESTAMENT</Text>
          <Text style={{ fontSize: 9.5, color: C.INK }}>
            {fam.typeTestament === 'authentique' ? 'Authentique (notarié)' : 'Olographe (manuscrit)'}
            {fam.dateTestament ? ` — ${new Date(fam.dateTestament).toLocaleDateString('fr-FR')}` : ''}
          </Text>
        </View>
      )}

      {fam.commentairesFamiliaux ? (
        <View style={{ marginBottom: 0 }}>
          <Text style={{ ...s.subLabel, marginBottom: 4 }}>COMMENTAIRES</Text>
          <Text style={{ fontSize: 9.5, color: C.INK, lineHeight: 1.5 }}>{fam.commentairesFamiliaux}</Text>
        </View>
      ) : null}
    </Page>
  )
}


// ─── Bilan Actif + Passif + Répartition ──────────────────────────────────────
function BilanActifPage({ bilan, calc, cabinet }: { bilan: BilanData; calc: BilanCalculations; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'

  // Pie chart helpers
  const totalActif = calc.totalActif
  const immoRatio = totalActif > 0 ? calc.totalActifImmobilier / totalActif : 0
  const finRatio  = totalActif > 0 ? calc.totalActifFinancier  / totalActif : 0
  const proRatio  = totalActif > 0 ? calc.totalActifProfessionnel / totalActif : 0

  function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  function arc(cx: number, cy: number, r: number, start: number, end: number) {
    if (end - start >= 360) end = 359.99
    const s2 = polarToCartesian(cx, cy, r, start)
    const e  = polarToCartesian(cx, cy, r, end)
    const large = end - start > 180 ? 1 : 0
    return `M ${cx} ${cy} L ${s2.x} ${s2.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`
  }

  const segments = [
    { ratio: immoRatio, color: C.FOREST,    label: 'Immobilier',    amount: calc.totalActifImmobilier },
    { ratio: finRatio,  color: C.GOLD,      label: 'Financier',     amount: calc.totalActifFinancier },
    { ratio: proRatio,  color: C.INK_LIGHT, label: 'Professionnel', amount: calc.totalActifProfessionnel },
  ].filter(seg => seg.ratio > 0)

  let deg = 0
  const pieSegments = segments.map(seg => {
    const start = deg
    const end = deg + seg.ratio * 360
    deg = end
    return { ...seg, path: arc(50, 50, 40, start, end) }
  })

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} />
      <SectionHeading
        num="02"
        slug="Bilan"
        title="Bilan Actif / Passif"
        subtitle={`Patrimoine consolidé au ${new Date().toLocaleDateString('fr-FR')}`}
      />

      {/* KPI row */}
      <View style={s.kpiRow}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>TOTAL ACTIF</Text>
          <Text style={{ ...s.kpiValue, color: C.FOREST }}>{fmtEur(calc.totalActif)}</Text>
          <Text style={s.kpiSub}>Avant déduction passif</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>PASSIF</Text>
          <Text style={{ ...s.kpiValue, color: C.NEG }}>{fmtEur(calc.totalPassif)}</Text>
          <Text style={s.kpiSub}>Emprunts en cours</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>PATRIMOINE NET</Text>
          <Text style={{ ...s.kpiValue, color: C.GOLD }}>{fmtEur(calc.patrimoineNet)}</Text>
          <Text style={s.kpiSub}>Au {new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
      </View>

      {/* Plus-value latente */}
      {calc.plusValueLatenteTotale !== 0 && (
        <View style={{ marginBottom: 14, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 0.5, borderColor: calc.plusValueLatenteTotale >= 0 ? C.FOREST : C.NEG, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: C.INK_MED, letterSpacing: 0.8 }}>PLUS-VALUE LATENTE IMMOBILIÈRE</Text>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 16, color: calc.plusValueLatenteTotale >= 0 ? C.POS : C.NEG }}>{fmtEur(calc.plusValueLatenteTotale)}</Text>
        </View>
      )}

      {/* Actif + Passif side by side */}
      <View style={{ flexDirection: 'row', gap: 20, marginBottom: 16 }}>

        {/* Actif table */}
        <View style={{ flex: 3 }}>
          <Text style={s.subLabel}>ACTIF</Text>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={{ ...s.tableHeadCell, flex: 2 }}>POSTE</Text>
              <Text style={{ ...s.tableHeadCell, flex: 1, textAlign: 'right' }}>VALEUR</Text>
            </View>

            {bilan.actif.immobilier.length > 0 && (
              <>
                <View style={{ ...s.tableRow, borderBottomWidth: 0 }}>
                  <Text style={{ flex: 2, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.INK_MED, letterSpacing: 0.8, paddingTop: 6 }}>IMMOBILIER</Text>
                  <Text style={{ flex: 1, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.INK_MED, textAlign: 'right', paddingTop: 6 }}>{fmtEur(calc.totalActifImmobilier)}</Text>
                </View>
                {bilan.actif.immobilier.map((bien) => {
                  const pv = bien.prixAcquisition > 0 ? bien.valeurEstimee - bien.prixAcquisition : null
                  const isLocatif = ['locatif_nu', 'locatif_meuble', 'lmnp'].includes(bien.type)
                  const rendement = isLocatif && bien.loyerMensuel > 0 && bien.valeurEstimee > 0
                    ? ((bien.loyerMensuel * 12 / bien.valeurEstimee) * 100).toFixed(1) + ' %'
                    : null
                  const meta: string[] = []
                  if (pv !== null) meta.push(`PV : ${fmtEur(pv)}`)
                  if (rendement) meta.push(`Rend. : ${rendement}`)
                  return (
                    <View key={bien.id} style={s.tableRow}>
                      <View style={{ flex: 2 }}>
                        <Text style={s.tableLabel}>{bien.libelle || bien.type}</Text>
                        {meta.length > 0 && (
                          <Text style={{ fontSize: 7.5, color: C.INK_LIGHT, marginTop: 2 }}>{meta.join('  ·  ')}</Text>
                        )}
                      </View>
                      <Text style={s.tableValue}>{fmtEur(bien.valeurEstimee)}</Text>
                    </View>
                  )
                })}
              </>
            )}

            {bilan.actif.financier.length > 0 && (
              <>
                <View style={{ ...s.tableRow, borderBottomWidth: 0 }}>
                  <Text style={{ flex: 2, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.INK_MED, letterSpacing: 0.8, paddingTop: 6 }}>FINANCIER</Text>
                  <Text style={{ flex: 1, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.INK_MED, textAlign: 'right', paddingTop: 6 }}>{fmtEur(calc.totalActifFinancier)}</Text>
                </View>
                {bilan.actif.financier.map((fin) => (
                  <View key={fin.id} style={s.tableRow}>
                    <Text style={s.tableLabel}>{fin.libelle || fin.type}{fin.etablissement ? ` — ${fin.etablissement}` : ''}</Text>
                    <Text style={s.tableValue}>{fmtEur(fin.valeur)}</Text>
                  </View>
                ))}
              </>
            )}

            {bilan.actif.professionnel.length > 0 && (
              <>
                <View style={{ ...s.tableRow, borderBottomWidth: 0 }}>
                  <Text style={{ flex: 2, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.INK_MED, letterSpacing: 0.8, paddingTop: 6 }}>PROFESSIONNEL</Text>
                  <Text style={{ flex: 1, fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.INK_MED, textAlign: 'right', paddingTop: 6 }}>{fmtEur(calc.totalActifProfessionnel)}</Text>
                </View>
                {bilan.actif.professionnel.map((pro) => (
                  <View key={pro.id} style={s.tableRow}>
                    <Text style={s.tableLabel}>{pro.libelle}{pro.pourcentageDetention ? ` (${pro.pourcentageDetention} %)` : ''}</Text>
                    <Text style={s.tableValue}>{fmtEur(pro.valeurEstimee)}</Text>
                  </View>
                ))}
              </>
            )}

            <View style={s.tableTotal}>
              <Text style={{ flex: 2, fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.INK }}>Total Actif</Text>
              <Text style={{ flex: 1, fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.INK, textAlign: 'right' }}>{fmtEur(calc.totalActif)}</Text>
            </View>
          </View>
        </View>

        {/* Passif table + pie chart */}
        <View style={{ flex: 2 }}>
          <Text style={s.subLabel}>PASSIF</Text>
          <View style={{ ...s.table, marginBottom: 20 }}>
            <View style={s.tableHead}>
              <Text style={{ ...s.tableHeadCell, flex: 2 }}>ENGAGEMENT</Text>
              <Text style={{ ...s.tableHeadCell, flex: 1, textAlign: 'right' }}>MONTANT</Text>
            </View>
            {bilan.passif.credits.map((credit) => (
              <View key={credit.id} style={s.tableRow}>
                <Text style={s.tableLabel}>{credit.libelle || credit.type}{credit.etablissement ? ` — ${credit.etablissement}` : ''}</Text>
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
              <Text style={{ flex: 2, fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.NEG }}>Total Passif</Text>
              <Text style={{ flex: 1, fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.NEG, textAlign: 'right' }}>{fmtEur(calc.totalPassif)}</Text>
            </View>
          </View>

          {/* Répartition du patrimoine */}
          {pieSegments.length > 0 && (
            <View style={{ padding: 12, borderWidth: 0.5, borderColor: C.BORDER }}>
              <Text style={{ ...s.subLabel, marginBottom: 8 }}>RÉPARTITION</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Svg width={80} height={80} viewBox="0 0 100 100">
                  {pieSegments.map((p, i) => <Path key={i} d={p.path} fill={p.color} />)}
                  <Circle cx={50} cy={50} r={26} fill={C.PARCHMENT} />
                </Svg>
                <View style={{ gap: 7, flex: 1 }}>
                  {segments.map((seg, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View style={{ width: 7, height: 7, backgroundColor: seg.color }} />
                        <Text style={{ fontSize: 8, color: C.INK }}>{seg.label}</Text>
                      </View>
                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.INK }}>
                        {Math.round(seg.ratio * 100)} %
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

    </Page>
  )
}

// ─── Revenus & Charges ──────────────────────────────────────────
function RevenusPage({ bilan, calc, cabinet }: { bilan: BilanData; calc: BilanCalculations; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const r = bilan.revenusCharges.revenus
  const c = bilan.revenusCharges.charges

  const revenusItems = [
    { label: 'Salaires nets',          value: r.salaireNet },
    { label: 'BIC / BNC',              value: r.bicBnc },
    { label: 'Revenus fonciers',        value: r.revenusFonciers },
    { label: 'Dividendes',             value: r.dividendes },
    { label: 'Plus-values',            value: r.plusValues },
    { label: 'Pensions / retraites',   value: r.pensions },
    { label: 'Autres revenus',         value: r.autresRevenus },
  ].filter(item => item.value > 0)

  const chargesItems = [
    { label: 'Remboursements crédits', value: c.remboursementsCredit },
    { label: 'Charges de copropriété', value: c.chargesCopropriete },
    { label: 'Pension alimentaire',    value: c.pensionAlimentaire },
    { label: 'Autres charges fixes',   value: c.autresCharges },
  ].filter(item => item.value > 0)

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} />
      <SectionHeading
        num="03"
        slug="Revenus &amp; Charges"
        title="Revenus &amp; Charges"
      />

      {/* Revenus foyer callout */}
      {calc.revenusFoyerAnnuels > 0 && (
        <View style={{ ...s.callout, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={s.calloutLabel}>REVENUS DU FOYER ANNUELS</Text>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 20, color: C.INK }}>{fmtEur(calc.revenusFoyerAnnuels)}</Text>
        </View>
      )}

      {/* Revenus / Charges side by side */}
      <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.subLabel}>REVENUS ANNUELS</Text>
          {revenusItems.map((item, i) => (
            <View key={i} style={{ ...s.tableRow }}>
              <Text style={{ ...s.tableLabel, fontSize: 9 }}>{item.label}</Text>
              <Text style={{ ...s.tableValue, fontSize: 9, color: C.POS }}>{fmtEur(item.value)}</Text>
            </View>
          ))}
          <View style={s.tableTotal}>
            <Text style={{ flex: 2, fontSize: 9, fontFamily: 'Helvetica-Bold' }}>Total annuel</Text>
            <Text style={{ flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.POS, textAlign: 'right' }}>{fmtEur(calc.revenusMensuelsTotaux * 12)}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.subLabel}>CHARGES ANNUELLES</Text>
          {chargesItems.map((item, i) => (
            <View key={i} style={{ ...s.tableRow }}>
              <Text style={{ ...s.tableLabel, fontSize: 9 }}>{item.label}</Text>
              <Text style={{ ...s.tableValue, fontSize: 9, color: C.NEG }}>{fmtEur(item.value)}</Text>
            </View>
          ))}
          <View style={s.tableTotal}>
            <Text style={{ flex: 2, fontSize: 9, fontFamily: 'Helvetica-Bold' }}>Total annuel</Text>
            <Text style={{ flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.NEG, textAlign: 'right' }}>{fmtEur(calc.chargesMensuellesTotales * 12)}</Text>
          </View>
        </View>
      </View>

      {/* Capacité épargne */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <View style={{ flex: 1, padding: 12, borderWidth: 0.5, borderColor: C.BORDER }}>
          <Text style={s.kpiLabel}>CAPACITÉ D’ÉPARGNE MENSUELLE</Text>
          <Text style={{ ...s.kpiValue, fontSize: 17, color: calc.capaciteEpargneMensuelle >= 0 ? C.POS : C.NEG }}>
            {fmtEur(calc.capaciteEpargneMensuelle)}
          </Text>
        </View>
        {calc.tauxEndettement > 0 && (
          <View style={{ flex: 1, padding: 12, borderWidth: 0.5, borderColor: C.BORDER }}>
            <Text style={s.kpiLabel}>TAUX D’ENDETTEMENT</Text>
            <Text style={{ ...s.kpiValue, fontSize: 17, color: calc.tauxEndettement > 35 ? C.NEG : C.POS }}>
              {calc.tauxEndettement.toFixed(1)} %
            </Text>
          </View>
        )}
      </View>

      {/* Revenus conjoint */}
      {bilan.revenusCharges.revenus.salaireNetConjoint > 0 && (
        <View style={{ ...s.callout, borderLeftColor: C.FOREST_MED }}>
          <Text style={{ ...s.calloutLabel, color: C.FOREST_MED }}>REVENUS DU CONJOINT</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 9, color: C.INK }}>Salaires nets</Text>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.INK }}>{fmtEur(bilan.revenusCharges.revenus.salaireNetConjoint)}</Text>
          </View>
        </View>
      )}
    </Page>
  )
}

// ─── Analyse Fiscale & Succession ─────────────────────────────────────────
function FiscalitePage({ bilan, calc, cabinet }: { bilan: BilanData; calc: BilanCalculations; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const f = bilan.fiscalite

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} />
      <SectionHeading
        num="04"
        slug="Fiscalité"
        title="Analyse Fiscale &amp; Succession"
      />

      {/* TMI + IFI + actif net */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <View style={{ flex: 1, padding: 12, borderWidth: 0.5, borderColor: C.BORDER }}>
          <Text style={s.kpiLabel}>TMI</Text>
          <Text style={{ ...s.kpiValue, fontSize: 22 }}>{calc.tmi} %</Text>
          <Text style={s.kpiSub}>Tranche marginale d’imposition</Text>
        </View>
        {calc.isAssujettisIFI && (
          <View style={{ flex: 1, padding: 12, borderWidth: 0.5, borderColor: C.NEG }}>
            <Text style={{ ...s.kpiLabel, color: C.NEG }}>IFI ESTIMÉ</Text>
            <Text style={{ ...s.kpiValue, fontSize: 22, color: C.NEG }}>{fmtEur(calc.estimationIFI)}</Text>
            <Text style={s.kpiSub}>Assujetti à l’IFI</Text>
          </View>
        )}
        <View style={{ flex: 1, padding: 12, borderWidth: 0.5, borderColor: C.BORDER }}>
          <Text style={s.kpiLabel}>ACTIF NET SUCCESSORAL</Text>
          <Text style={{ ...s.kpiValue, fontSize: 16 }}>{fmtEur(calc.actifNetSuccessoral)}</Text>
          <Text style={s.kpiSub}>Base de calcul succession</Text>
        </View>
      </View>

      {/* Succession */}
      {f.heritiers.length > 0 && (
        <View style={{ marginBottom: 18 }}>
          <Text style={s.subLabel}>SUCCESSION ESTIMÉE</Text>
          <View style={s.table}>
            {f.heritiers.map((h) => (
              <View key={h.id} style={s.tableRow}>
                <Text style={s.tableLabel}>{h.prenom || h.lien}</Text>
                <Text style={s.tableValue}>{h.lien === 'conjoint' ? 'Exonéré' : `Abattement : ${fmtEur(h.abattementRestant)}`}</Text>
              </View>
            ))}
          </View>
          <View style={{ padding: 10, borderWidth: 0.5, borderColor: C.BORDER, marginTop: 4 }}>
            <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.INK }}>
              Droits estimés total : {fmtEur(calc.droitsSuccessionEstimes)}
            </Text>
            <Text style={{ fontSize: 8, color: C.INK_MED, marginTop: 3 }}>
              Estimation indicative — ne se substitue pas au calcul notarial
            </Text>
          </View>
        </View>
      )}

      {f.strategieSuccession ? (
        <View style={{ ...s.callout, marginBottom: 12 }}>
          <Text style={s.calloutLabel}>STRATÉGIE DE SUCCESSION</Text>
          <Text style={s.calloutText}>{f.strategieSuccession}</Text>
        </View>
      ) : null}

      {f.observationsFiscales ? (
        <View style={{ ...s.callout }}>
          <Text style={s.calloutLabel}>OBSERVATIONS FISCALES</Text>
          <Text style={s.calloutText}>{f.observationsFiscales}</Text>
        </View>
      ) : null}
    </Page>
  )
}

// ─── Profil de risque & Objectifs ────────────────────────────────────────────
function ProfilObjectifsPage({ bilan, cabinet }: { bilan: BilanData; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const pr = bilan.profilRisque
  const objectifsSelected = bilan.objectifs.objectifs.filter(o => o.selected)

  const PROFIL_COLORS: Record<string, string> = {
    prudent: C.POS, equilibre: C.GOLD, dynamique: C.FOREST, offensif: C.INK
  }
  const PROFIL_LABELS: Record<string, string> = {
    prudent: 'Prudent', equilibre: 'Équilibré', dynamique: 'Dynamique', offensif: 'Offensif'
  }
  const PRIORITE_COLORS: Record<string, string> = {
    haute: C.NEG, moyenne: C.GOLD, basse: C.INK_LIGHT
  }
  const OBJECTIF_LABELS: Record<string, string> = {
    conservation: 'Conservation du capital', revenu: 'Recherche de revenus',
    croissance: 'Croissance à long terme', speculation: 'Spéculation',
  }
  const HORIZON_LABELS: Record<string, string> = {
    moins_1an: 'Moins d’1 an', '1_3ans': '1 à 3 ans',
    '3_5ans': '3 à 5 ans', plus_5ans: 'Plus de 5 ans',
  }
  const EXP_LABELS: Record<string, string> = {
    debutant: 'Débutant', intermediaire: 'Intermédiaire',
    experimente: 'Expérimenté', expert: 'Expert',
  }
  const ILLIQ_LABELS: Record<string, string> = {
    moins_10: 'Moins de 10 %', '10_30': '10 à 30 %',
    '30_60': '30 à 60 %', plus_60: 'Plus de 60 %',
  }
  const CLASS_LABELS: Record<string, string> = {
    non_professionnel: 'Client non professionnel',
    professionnel: 'Client professionnel',
    contrepartie_eligible: 'Contrepartie éligible',
  }
  const DELAI_LABELS: Record<string, string> = {
    moins_3ans: 'Moins de 3 ans', '3_5ans': '3 à 5 ans',
    '5_10ans': '5 à 10 ans', plus_10ans: 'Plus de 10 ans',
  }

  const profilColor = pr.resultat ? (PROFIL_COLORS[pr.resultat] || C.INK) : C.INK

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} />
      <SectionHeading num="05" slug="Profil &amp; Objectifs" title="Profil de Risque &amp; Objectifs" />

      {/* Profil MIF2 */}
      {pr.resultat ? (
        <View style={{ ...s.callout, borderLeftColor: profilColor, marginBottom: 22 }}>
          <Text style={s.subLabel}>PROFIL MIF2</Text>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 26, color: profilColor, marginBottom: 10, lineHeight: 1 }}>
            {PROFIL_LABELS[pr.resultat] || pr.resultat}
          </Text>
          <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
            {pr.objectif   && <Text style={{ fontSize: 8, color: C.INK_MED }}>Objectif : {OBJECTIF_LABELS[pr.objectif] || pr.objectif}</Text>}
            {pr.horizon    && <Text style={{ fontSize: 8, color: C.INK_MED }}>Horizon : {HORIZON_LABELS[pr.horizon] || pr.horizon}</Text>}
            {pr.experience && <Text style={{ fontSize: 8, color: C.INK_MED }}>Expérience : {EXP_LABELS[pr.experience] || pr.experience}</Text>}
            {pr.toleranceIlliquidite && <Text style={{ fontSize: 8, color: C.INK_MED }}>Illiquidité : {ILLIQ_LABELS[pr.toleranceIlliquidite] || pr.toleranceIlliquidite}</Text>}
            {pr.classificationClient && <Text style={{ fontSize: 8, color: C.INK_MED }}>{CLASS_LABELS[pr.classificationClient] || pr.classificationClient}</Text>}
          </View>
          {(pr.revenuAnnuelConfirme > 0 || pr.patrimoineFinancierConfirme > 0 || pr.chargesFixesConfirmees > 0) && (
            <View style={{ flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: C.BORDER, flexWrap: 'wrap' }}>
              {pr.revenuAnnuelConfirme    > 0 && <Text style={{ fontSize: 8, color: C.INK_MED }}>Revenu confirmé : {fmtEur(pr.revenuAnnuelConfirme)}</Text>}
              {pr.patrimoineFinancierConfirme > 0 && <Text style={{ fontSize: 8, color: C.INK_MED }}>Patrimoine financier confirmé : {fmtEur(pr.patrimoineFinancierConfirme)}</Text>}
              {pr.chargesFixesConfirmees  > 0 && <Text style={{ fontSize: 8, color: C.INK_MED }}>Charges fixes confirmées : {fmtEur(pr.chargesFixesConfirmees)}</Text>}
            </View>
          )}
        </View>
      ) : null}

      {/* Objectifs */}
      {objectifsSelected.length > 0 && (
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={s.subLabel}>OBJECTIFS PATRIMONIAUX</Text>
            {bilan.objectifs.preferencesESG && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderWidth: 0.5, borderColor: C.FOREST }}>
                <Text style={{ fontSize: 7, color: C.FOREST, letterSpacing: 0.8 }}>PRÉFÉRENCES ESG</Text>
              </View>
            )}
          </View>
          <View style={{ gap: 6 }}>
            {objectifsSelected.map((obj, idx) => {
              const meta: string[] = []
              if (obj.montantCible > 0) meta.push(fmtEur(obj.montantCible))
              if (obj.delaiCible) meta.push(DELAI_LABELS[obj.delaiCible] || obj.delaiCible.replace(/_/g, ' '))
              return (
                <View key={obj.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderWidth: 0.5, borderColor: C.BORDER }}>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.GOLD, marginRight: 14, width: 16 }}>
                    {String(idx + 1).padStart(2, '0')}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9.5, color: C.INK }}>{obj.libelle}</Text>
                    {meta.length > 0 && (
                      <Text style={{ fontSize: 8, color: C.INK_MED, marginTop: 2 }}>{meta.join('  ·  ')}</Text>
                    )}
                  </View>
                  {obj.priorite ? (
                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: PRIORITE_COLORS[obj.priorite] || C.INK_LIGHT }}>
                      {obj.priorite.charAt(0).toUpperCase() + obj.priorite.slice(1)}
                    </Text>
                  ) : null}
                </View>
              )
            })}
          </View>
        </View>
      )}

      {bilan.objectifs.commentaires ? (
        <View style={s.callout}>
          <Text style={s.calloutLabel}>COMMENTAIRES CLIENT</Text>
          <Text style={s.calloutText}>{bilan.objectifs.commentaires}</Text>
        </View>
      ) : null}
    </Page>
  )
}

// ─── Recommandations & Mentions légales ─────────────────────────────────────
function RecommandationsPage({ bilan, cabinet }: { bilan: BilanData; cabinet: ParametresCabinet }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const conseiller = [cabinet.prenomConseiller, cabinet.nomConseiller].filter(Boolean).join(' ')
  const dateStr = new Date().toLocaleDateString('fr-FR')

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} />

      {bilan.objectifs.recommandations ? (
        <View style={{ marginBottom: 28 }}>
          <SectionHeading num="06" slug="Recommandations" title="Recommandations" />
          <Text style={{ fontSize: 10, color: C.INK, lineHeight: 1.8, fontFamily: 'Helvetica' }}>
            {bilan.objectifs.recommandations}
          </Text>
        </View>
      ) : null}

      {/* Signatures */}
      <View style={{ marginTop: 28, paddingTop: 20, borderTopWidth: 0.5, borderTopColor: C.BORDER_DARK }}>
        <Text style={{ fontFamily: 'Times-Roman', fontSize: 16, color: C.INK, marginBottom: 20 }}>Signatures</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '44%' }}>
            <Text style={{ fontSize: 9, color: C.INK_MED, marginBottom: 30 }}>Signature du client :</Text>
            <View style={{ borderBottomWidth: 0.5, borderBottomColor: C.INK }} />
            <Text style={{ fontSize: 8, color: C.INK_MED, marginTop: 5 }}>
              {[bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ')}
            </Text>
          </View>
          <View style={{ width: '44%' }}>
            <Text style={{ fontSize: 9, color: C.INK_MED, marginBottom: 30 }}>Signature du conseiller :</Text>
            <View style={{ borderBottomWidth: 0.5, borderBottomColor: C.INK }} />
            <Text style={{ fontSize: 8, color: C.INK_MED, marginTop: 5 }}>
              {[cabinet.prenomConseiller, cabinet.nomConseiller].filter(Boolean).join(' ')}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 8, color: C.INK_MED, marginTop: 14 }}>
          Fait à _____________, le {dateStr}
        </Text>
      </View>

      {/* Footer legal */}
      <View style={{ marginTop: 'auto', paddingTop: 20, borderTopWidth: 0.5, borderTopColor: C.BORDER }}>
        <Text style={{ fontSize: 7.5, color: C.INK_LIGHT, marginBottom: 3 }}>
          Document établi le {dateStr}{conseiller ? ` par ${conseiller}` : ''}{cabinet.nomCabinet ? `, ${cabinet.nomCabinet}` : ''}.
        </Text>
        {cabinet.numeroOrias ? (
          <Text style={{ fontSize: 7.5, color: C.INK_LIGHT, marginBottom: 3 }}>
            Conseiller en Gestion de Patrimoine immatriculé à l’ORIAS sous le numéro {cabinet.numeroOrias} (www.orias.fr).
          </Text>
        ) : null}
        <Text style={{ fontSize: 7.5, color: C.INK_LIGHT, lineHeight: 1.5 }}>
          {cabinet.mentionsLegales || 'Ce document est établi à titre informatif. Il ne constitue pas un conseil en investissement au sens de la réglementation MIF2.'}
        </Text>
      </View>
    </Page>
  )
}

// ─── Main document ────────────────────────────────────────────────────────────
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
      <IdentitePage bilan={bilan} cabinet={cabinet} />
      <BilanActifPage bilan={bilan} calc={calculations} cabinet={cabinet} />
      <RevenusPage bilan={bilan} calc={calculations} cabinet={cabinet} />
      <FiscalitePage bilan={bilan} calc={calculations} cabinet={cabinet} />
      <ProfilObjectifsPage bilan={bilan} cabinet={cabinet} />
      <RecommandationsPage bilan={bilan} cabinet={cabinet} />
    </Document>
  )
}
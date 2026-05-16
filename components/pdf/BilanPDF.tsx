import {
  Document, Page, Text, View, StyleSheet, Image, Svg, Circle, Path,
} from '@react-pdf/renderer'
import type { BilanData, CabinetConfig, BilanCalculations } from '@/lib/types'

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmtEur = (n: number): string => {
  const abs = Math.round(Math.abs(n))
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (n < 0 ? '-' : '') + s + ' €'
}

// ─── Palette — Système Charlie unifié (voir DESIGN.md) ─────────────────────────
const C = {
  PARCHMENT:   '#FAF6EF',   // fond de page — crème chaud
  PANEL:       '#F5EFE6',   // cartes KPI, callouts
  INK:         '#1A1410',   // texte principal
  INK_MED:     '#5C4E42',   // texte secondaire
  INK_LIGHT:   '#9A8B7C',   // captions, labels
  GOLD:        '#9C7A4E',   // accent or / sable
  NAVY:        '#0F2844',   // navy structurel
  FOREST:      '#1F4535',   // vert institutionnel
  FOREST_2:    '#2A5A45',   // vert moyen
  SAND:        '#C9B79A',   // sable clair — catégorie data-viz
  PEBBLE:      '#9A8B7C',   // galets — catégorie data-viz
  BORDER:      '#E8DDD0',   // séparateurs hairline
  BORDER_DARK: '#D4C5B0',   // règle principale
  POS:         '#1F4535',   // positif
  NEG:         '#B91C1C',   // négatif / rouge
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({

  // Page
  page: {
    backgroundColor: C.PARCHMENT,
    paddingHorizontal: 48,
    paddingTop: 38,
    paddingBottom: 48,
    fontFamily: 'Helvetica',
    flexDirection: 'column',
  },
  coverPage: {
    backgroundColor: C.PARCHMENT,
    flexDirection: 'column',
  },

  // ── En-tête interne ─────────────────────────────────────────────────────────
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.BORDER_DARK,
  },
  pageHeaderCabinet: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.FOREST,
    letterSpacing: 1.8,
  },
  pageHeaderTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.INK,
    letterSpacing: 0.8,
    textAlign: 'right',
  },
  pageHeaderSub: {
    fontSize: 7.5,
    color: C.INK_LIGHT,
    textAlign: 'right',
    marginTop: 2,
  },

  // ── Numéro + titre de section ────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 7.5,
    color: C.INK_LIGHT,
    letterSpacing: 2,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Times-Roman',
    fontSize: 22,
    color: C.INK,
    lineHeight: 1.2,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 8.5,
    color: C.INK_MED,
    marginBottom: 20,
    lineHeight: 1.5,
  },

  // ── Sous-labels ──────────────────────────────────────────────────────────────
  subLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.INK_LIGHT,
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  // ── Cartes KPI (remplissage, pas de bordure) ─────────────────────────────────
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  kpiCard: {
    flex: 1,
    padding: 14,
    backgroundColor: C.PANEL,
  },
  kpiLabel: {
    fontSize: 6.5,
    color: C.INK_LIGHT,
    letterSpacing: 1.4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontFamily: 'Times-Roman',
    fontSize: 22,
    color: C.INK,
    lineHeight: 1,
  },
  kpiSub: { fontSize: 7.5, color: C.INK_MED, marginTop: 5 },

  // ── Tables (hairlines uniquement) ────────────────────────────────────────────
  table: { marginBottom: 18 },
  tableHead: {
    flexDirection: 'row',
    paddingBottom: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.BORDER,
    marginBottom: 2,
  },
  tableHeadCell: {
    fontSize: 6.5,
    color: C.INK_LIGHT,
    letterSpacing: 1.2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.BORDER,
  },
  tableLabel: { flex: 2, fontSize: 9.5, color: C.INK },
  tableValue: { flex: 1, fontSize: 9.5, color: C.INK, textAlign: 'right' },
  tableTotal: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: C.BORDER_DARK,
  },

  // ── Encadré éditorial (bordure gauche or) ────────────────────────────────────
  callout: {
    borderLeftWidth: 3,
    borderLeftColor: C.GOLD,
    backgroundColor: C.PANEL,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  calloutLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: C.GOLD,
    letterSpacing: 1.8,
    marginBottom: 8,
  },
  calloutText: {
    fontSize: 9.5,
    color: C.INK,
    lineHeight: 1.7,
  },
})

// ─── Helpers SVG donut ────────────────────────────────────────────────────────
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  if (end - start >= 360) end = 359.99
  const s = polarToCartesian(cx, cy, r, start)
  const e = polarToCartesian(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`
}

// ─── En-tête de page interne ─────────────────────────────────────────────────
function PageHeader({ cabinet, clientName, docTitle }: {
  cabinet: CabinetConfig
  clientName: string
  docTitle: string
}) {
  const nomCabinet = (cabinet.nom || 'Charlie').toUpperCase()
  const ref = `${nomCabinet.slice(0, 3)}-${(clientName.split(' ').pop() || 'XX').slice(0, 2).toUpperCase()}-BIL-${new Date().getFullYear()}`
  return (
    <View style={s.pageHeader}>
      <View>
        {cabinet.logo ? (
          <Image src={cabinet.logo} style={{ height: 16, maxWidth: 70, objectFit: 'contain' }} />
        ) : (
          <>
            <Text style={s.pageHeaderCabinet}>{nomCabinet}</Text>
            {/* Filet or sous le nom */}
            <View style={{ width: 28, height: 1.5, backgroundColor: C.GOLD, marginTop: 3 }} />
          </>
        )}
      </View>
      <View>
        <Text style={s.pageHeaderTitle}>{docTitle.toUpperCase()}</Text>
        <Text style={s.pageHeaderSub}>{clientName} · Réf. {ref}</Text>
      </View>
    </View>
  )
}

// ─── Pied de page (chaque page) ──────────────────────────────────────────────
function PageFooter({ cabinet }: { cabinet: CabinetConfig }) {
  const nomCabinet = (cabinet.nom || 'Charlie').toUpperCase()
  return (
    <View style={{
      marginTop: 'auto',
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: C.BORDER,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <Text style={{ fontSize: 6.5, color: C.INK_LIGHT, letterSpacing: 0.5 }}>
        {nomCabinet} · STRICTEMENT CONFIDENTIEL
      </Text>
      <Text
        style={{ fontSize: 6.5, color: C.INK_LIGHT }}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  )
}

// ─── En-tête de section ────────────────────────────────────────────────────────
function SectionHeading({ num, slug, title, subtitle }: {
  num: string; slug: string; title: string; subtitle?: string
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.sectionLabel}>
        <Text style={{ color: C.GOLD }}>{num}</Text>{' · '}{slug.toUpperCase()}
      </Text>
      <Text style={s.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={s.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  )
}

// ─── Page de garde ────────────────────────────────────────────────────────────
function CoverPage({ bilan, cabinet }: { bilan: BilanData; cabinet: CabinetConfig }) {
  const clientName = [bilan.identite.civilite, bilan.identite.prenom, bilan.identite.nom]
    .filter(Boolean).join(' ') || 'Client'
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const conseiller = [cabinet.prenomConseiller, cabinet.nomConseiller].filter(Boolean).join(' ')
  const nomCabinet = (cabinet.nom || 'Charlie').toUpperCase()
  const ref = `${nomCabinet.slice(0, 3)}-${(bilan.identite.nom || 'XX').slice(0, 2).toUpperCase()}-BIL-${new Date().getFullYear()}`

  return (
    <Page size="A4" style={s.coverPage}>
      <View style={{ flex: 1, paddingHorizontal: 56, paddingTop: 52, paddingBottom: 44, flexDirection: 'column' }}>

        {/* Cabinet */}
        <View>
          {cabinet.logo ? (
            <Image src={cabinet.logo} style={{ height: 28, maxWidth: 120, objectFit: 'contain', marginBottom: 6 }} />
          ) : (
            <>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.FOREST, letterSpacing: 2.2 }}>
                {nomCabinet}
              </Text>
              <View style={{ width: 28, height: 1.5, backgroundColor: C.GOLD, marginTop: 4 }} />
            </>
          )}
          {cabinet.adresse ? (
            <Text style={{ fontSize: 7.5, color: C.INK_LIGHT, letterSpacing: 0.5, marginTop: 6 }}>
              {cabinet.adresse.toUpperCase()}
            </Text>
          ) : null}
        </View>

        {/* Bloc titre */}
        <View style={{ marginTop: 80 }}>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.INK_LIGHT, letterSpacing: 2.5, marginBottom: 30 }}>
            RAPPORT CLIENT
          </Text>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 52, color: C.INK, lineHeight: 1.0 }}>
            Bilan
          </Text>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 52, color: C.INK, lineHeight: 1.0 }}>
            patrimonial
          </Text>
          {/* Filet or sous "patrimonial" */}
          <View style={{ width: 148, height: 1.5, backgroundColor: C.GOLD, marginTop: 6, marginBottom: 22 }} />
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 13, color: C.INK_MED }}>
            {'É'}tat au {dateStr}
          </Text>
        </View>

        {/* Destinataire */}
        <View style={{ marginTop: 56 }}>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.INK_LIGHT, letterSpacing: 2.5, marginBottom: 14 }}>
            PR{'É'}PAR{'É'} POUR
          </Text>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 24, color: C.INK, marginBottom: 5 }}>
            {clientName}
          </Text>
          {conseiller ? (
            <Text style={{ fontSize: 9, color: C.INK_MED }}>
              Conseiller : {conseiller}
            </Text>
          ) : null}
        </View>

        {/* Espace flexible */}
        <View style={{ flex: 1 }} />

        {/* Pied de couverture */}
        <View style={{
          borderTopWidth: 0.5,
          borderTopColor: C.BORDER_DARK,
          paddingTop: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
          <View style={{ gap: 3 }}>
            <Text style={{ fontSize: 7.5, color: C.INK_LIGHT }}>Référence : {ref}</Text>
            <Text style={{ fontSize: 7.5, color: C.INK_LIGHT }}>Date d’estimation : {dateStr}</Text>
            {cabinet.orias ? (
              <Text style={{ fontSize: 7.5, color: C.INK_LIGHT }}>
                Immatriculé ORIAS n° {cabinet.orias}
              </Text>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.GOLD, letterSpacing: 1.5 }}>
              STRICTEMENT CONFIDENTIEL
            </Text>
            <Text style={{ fontSize: 7, color: C.INK_LIGHT }}>Document personnel · Ne pas diffuser</Text>
          </View>
        </View>
      </View>
    </Page>
  )
}

// ─── Synthèse patrimoniale ────────────────────────────────────────────────────
function SynthesePage({ bilan, calc, cabinet }: { bilan: BilanData; calc: BilanCalculations; cabinet: CabinetConfig }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'

  // Donut chart
  const total = calc.totalActif
  const segments = [
    { ratio: total > 0 ? calc.totalActifImmobilier / total : 0,    color: C.FOREST,   label: 'Immobilier',    amount: calc.totalActifImmobilier },
    { ratio: total > 0 ? calc.totalActifFinancier / total : 0,     color: C.GOLD,     label: 'Financier',     amount: calc.totalActifFinancier },
    { ratio: total > 0 ? calc.totalActifProfessionnel / total : 0, color: C.SAND,     label: 'Professionnel', amount: calc.totalActifProfessionnel },
  ].filter(seg => seg.ratio > 0.001)

  let deg = 0
  const pieSegments = segments.map(seg => {
    const start = deg
    const end = deg + seg.ratio * 360
    deg = end
    return { ...seg, path: arcPath(50, 50, 48, start, end) }
  })

  // Total patrimoine brut formaté court (ex: "1.71 M€")
  const patrimoineShort = total >= 1_000_000
    ? `${(total / 1_000_000).toFixed(2)} M€`
    : `${Math.round(total / 1000)} k€`

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} docTitle="Bilan patrimonial" />
      <SectionHeading num="02" slug="Synthèse patrimoniale" title="Vue d’ensemble"
        subtitle={`Patrimoine consolidé au ${new Date().toLocaleDateString('fr-FR')}.`} />

      {/* Cartes KPI */}
      <View style={s.kpiRow}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>PATRIMOINE BRUT</Text>
          <Text style={{ ...s.kpiValue, color: C.INK }}>{fmtEur(calc.totalActif)}</Text>
          <Text style={s.kpiSub}>Avant déduction passif</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>PASSIF</Text>
          <Text style={{ ...s.kpiValue, color: C.NEG }}>{fmtEur(calc.totalPassif)}</Text>
          <Text style={s.kpiSub}>Emprunts en cours</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>PATRIMOINE NET</Text>
          <Text style={{ ...s.kpiValue, color: C.FOREST }}>{fmtEur(calc.patrimoineNet)}</Text>
          <Text style={s.kpiSub}>Au {new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
        {calc.tauxEndettement > 0 && (
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>ENDETTEMENT</Text>
            <Text style={{ ...s.kpiValue, color: calc.tauxEndettement > 35 ? C.NEG : C.INK }}>
              {calc.tauxEndettement.toFixed(1)} %
            </Text>
            <Text style={s.kpiSub}>Des revenus nets</Text>
          </View>
        )}
      </View>

      {/* Callout lecture */}
      <View style={s.callout}>
        <Text style={s.calloutLabel}>LECTURE DU CONSEILLER</Text>
        <Text style={s.calloutText}>
          {`Votre patrimoine net s’établit à `}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmtEur(calc.patrimoineNet)}</Text>
          {`, structuré autour de `}
          {segments.map((seg, i) => (
            <Text key={i}>
              {i > 0 ? (i === segments.length - 1 ? ' et d’un ' : ', d’un ') : 'un '}
              {seg.label.toLowerCase()}
              {` (à hauteur de ${Math.round(seg.ratio * 100)} %)`}
            </Text>
          ))}
          {`. Le passif s’élève à `}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmtEur(calc.totalPassif)}</Text>
          {`, soit un taux d’endettement de ${calc.tauxEndettement.toFixed(1)} %.`}
        </Text>
      </View>

      {/* Répartition donut + légende */}
      {pieSegments.length > 0 && (
        <View style={{ backgroundColor: C.PANEL, padding: 20, marginBottom: 0 }}>
          <Text style={{ ...s.subLabel, marginBottom: 14 }}>RÉPARTITION PAR CATÉGORIE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28 }}>
            {/* Donut SVG + valeur centrale superposée */}
            <View style={{ width: 120, height: 120, position: 'relative' }}>
              <Svg width={120} height={120} viewBox="0 0 100 100">
                {pieSegments.map((p, i) => <Path key={i} d={p.path} fill={p.color} />)}
                {/* Trou central */}
                <Circle cx={50} cy={50} r={30} fill={C.PANEL} />
              </Svg>
              {/* Valeur centrale en overlay */}
              <View style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ fontFamily: 'Times-Roman', fontSize: 9.5, color: C.INK, textAlign: 'center' }}>
                  {patrimoineShort}
                </Text>
                <Text style={{ fontSize: 5.5, color: C.INK_LIGHT, letterSpacing: 0.6, textAlign: 'center', marginTop: 2 }}>
                  PATRIMOINE
                </Text>
              </View>
            </View>

            {/* Légende */}
            <View style={{ flex: 1, gap: 10 }}>
              {segments.map((seg, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 9, height: 9, backgroundColor: seg.color }} />
                    <Text style={{ fontSize: 9, color: C.INK }}>{seg.label}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                    <Text style={{ fontSize: 9, color: C.INK_MED }}>{fmtEur(seg.amount)}</Text>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.INK, width: 36, textAlign: 'right' }}>
                      {Math.round(seg.ratio * 100)} %
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <PageFooter cabinet={cabinet} />
    </Page>
  )
}

// ─── Inventaire détaillé des actifs ──────────────────────────────────────────
function InventairePage({ bilan, calc, cabinet }: { bilan: BilanData; calc: BilanCalculations; cabinet: CabinetConfig }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} docTitle="Bilan patrimonial" />
      <SectionHeading num="03" slug="Détail des actifs" title="Inventaire détaillé"
        subtitle="Détail par classe d’actifs — immobilier, financier, professionnel et passif." />

      {/* Actifs immobiliers */}
      {bilan.actif.immobilier.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={s.subLabel}>ACTIFS IMMOBILIERS</Text>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={{ ...s.tableHeadCell, flex: 2 }}>BIEN</Text>
              <Text style={{ ...s.tableHeadCell, flex: 1 }}>LOCALISATION</Text>
              <Text style={{ ...s.tableHeadCell, flex: 1, textAlign: 'right' }}>VALEUR ESTIMÉE</Text>
            </View>
            {bilan.actif.immobilier.map((bien) => {
              const IMMO_TYPE_LABELS: Record<string, string> = {
                residence_principale: 'Résidence principale',
                residence_secondaire: 'Résidence secondaire',
                locatif_nu: 'Bien locatif (nu)',
                locatif_meuble: 'Bien locatif (meublé)',
                lmnp: 'LMNP',
                locatif: 'Bien locatif',
                scpi: 'SCPI',
                terrain: 'Terrain',
                autre: 'Autre',
              }
              const pv = bien.prixAcquisition > 0 ? bien.valeurEstimee - bien.prixAcquisition : null
              const isLocatif = ['locatif_nu', 'locatif_meuble', 'lmnp', 'locatif'].includes(bien.type)
              const rend = isLocatif && bien.loyerMensuel > 0 && bien.valeurEstimee > 0
                ? `${((bien.loyerMensuel * 12 / bien.valeurEstimee) * 100).toFixed(1)} %`
                : null
              const meta: string[] = []
              if (pv !== null) meta.push(`PV : ${fmtEur(pv)}`)
              if (rend) meta.push(`Rend. : ${rend}`)
              return (
                <View key={bien.id} style={s.tableRow}>
                  <View style={{ flex: 2 }}>
                    <Text style={s.tableLabel}>{bien.libelle || IMMO_TYPE_LABELS[bien.type] || bien.type}</Text>
                    {meta.length > 0 && (
                      <Text style={{ fontSize: 7.5, color: C.INK_LIGHT, marginTop: 2 }}>{meta.join('  ·  ')}</Text>
                    )}
                  </View>
                  <Text style={{ flex: 1, fontSize: 9.5, color: C.INK_MED }}>{bien.adresse || '—'}</Text>
                  <Text style={s.tableValue}>{fmtEur(bien.valeurEstimee)}</Text>
                </View>
              )
            })}
            <View style={s.tableTotal}>
              <Text style={{ flex: 2, fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.INK }}>Sous-total immobilier</Text>
              <Text style={{ flex: 2, fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.INK, textAlign: 'right' }}>{fmtEur(calc.totalActifImmobilier)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Actifs financiers */}
      {bilan.actif.financier.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={s.subLabel}>ACTIFS FINANCIERS</Text>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={{ ...s.tableHeadCell, flex: 2 }}>POSTE</Text>
              <Text style={{ ...s.tableHeadCell, flex: 1 }}>GESTION</Text>
              <Text style={{ ...s.tableHeadCell, flex: 1, textAlign: 'right' }}>VALEUR</Text>
            </View>
            {bilan.actif.financier.map((fin) => {
              const FIN_TYPE_LABELS: Record<string, string> = {
                assurance_vie: 'Assurance-vie',
                pea: 'PEA',
                per: 'PER',
                compte_titres: 'Compte-titres',
                livret_a: 'Livret A',
                ldds: 'LDDS',
                lep: 'LEP',
                pel: 'PEL',
                cel: 'CEL',
                crypto: 'Crypto-actifs',
                crowdfunding: 'Crowdfunding',
                livrets: 'Livrets réglementés',
                autre: 'Autre',
              }
              // Compat ascendante : description→libelle, valeurRachat→valeur, compagnie→etablissement
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const f = fin as any
              const libelle = f.libelle || f.description || FIN_TYPE_LABELS[fin.type] || fin.type
              const etab = f.etablissement || f.compagnie
              const valeur = typeof f.valeur === 'number' ? f.valeur : (typeof f.valeurRachat === 'number' ? f.valeurRachat : 0)
              return (
                <View key={fin.id} style={s.tableRow}>
                  <Text style={{ ...s.tableLabel, flex: 2 }}>
                    {libelle}{etab ? ` — ${etab}` : ''}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 9.5, color: C.INK_MED }}>
                    {fin.beneficiaires ? 'Désign. bén.' : '—'}
                  </Text>
                  <Text style={s.tableValue}>{fmtEur(valeur)}</Text>
                </View>
              )
            })}
            <View style={s.tableTotal}>
              <Text style={{ flex: 2, fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.INK }}>Sous-total financier</Text>
              <Text style={{ flex: 2, fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.INK, textAlign: 'right' }}>{fmtEur(calc.totalActifFinancier)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Actifs professionnels */}
      {bilan.actif.professionnel.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={s.subLabel}>ACTIFS PROFESSIONNELS</Text>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={{ ...s.tableHeadCell, flex: 2 }}>BIEN</Text>
              <Text style={{ ...s.tableHeadCell, flex: 1 }}>NATURE</Text>
              <Text style={{ ...s.tableHeadCell, flex: 1, textAlign: 'right' }}>VALEUR ESTIMÉE</Text>
            </View>
            {bilan.actif.professionnel.map((pro) => (
              <View key={pro.id} style={s.tableRow}>
                <Text style={{ ...s.tableLabel, flex: 2 }}>
                  {pro.libelle}{pro.pourcentageDetention ? ` (${pro.pourcentageDetention} %)` : ''}
                </Text>
                <Text style={{ flex: 1, fontSize: 9.5, color: C.INK_MED }}>{pro.type || '—'}</Text>
                <Text style={s.tableValue}>{fmtEur(pro.valeurEstimee)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Passif */}
      {(bilan.passif.credits.length > 0 || bilan.passif.autresDettes > 0) && (
        <View style={{ marginBottom: 0 }}>
          <Text style={s.subLabel}>PASSIF</Text>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={{ ...s.tableHeadCell, flex: 2 }}>ENGAGEMENT</Text>
              <Text style={{ ...s.tableHeadCell, flex: 1, textAlign: 'right' }}>MONTANT</Text>
            </View>
            {bilan.passif.credits.map((credit) => {
              const CREDIT_TYPE_LABELS: Record<string, string> = {
                immobilier: 'Crédit immobilier',
                consommation: 'Crédit consommation',
                professionnel: 'Dette professionnelle',
                autre: 'Autre engagement',
              }
              const label = credit.libelle || CREDIT_TYPE_LABELS[credit.type] || credit.type
              return (
                <View key={credit.id} style={s.tableRow}>
                  <Text style={{ ...s.tableLabel, flex: 2 }}>
                    {label}{credit.etablissement ? ` — ${credit.etablissement}` : ''}
                    {credit.tauxInteret ? `  ·  Taux : ${credit.tauxInteret} %` : ''}
                  </Text>
                  <Text style={{ ...s.tableValue, color: C.NEG }}>{fmtEur(credit.capitalRestantDu)}</Text>
                </View>
              )
            })}
            {bilan.passif.autresDettes > 0 && (
              <View style={s.tableRow}>
                <Text style={{ ...s.tableLabel, flex: 2 }}>Autres dettes</Text>
                <Text style={{ ...s.tableValue, color: C.NEG }}>{fmtEur(bilan.passif.autresDettes)}</Text>
              </View>
            )}
            <View style={s.tableTotal}>
              <Text style={{ flex: 2, fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.NEG }}>Total passif</Text>
              <Text style={{ flex: 1, fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.NEG, textAlign: 'right' }}>{fmtEur(calc.totalPassif)}</Text>
            </View>
          </View>
        </View>
      )}

      <PageFooter cabinet={cabinet} />
    </Page>
  )
}

// ─── Revenus & Charges ────────────────────────────────────────────────────────
function RevenusPage({ bilan, calc, cabinet }: { bilan: BilanData; calc: BilanCalculations; cabinet: CabinetConfig }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const r = bilan.revenusCharges.revenus
  const c = bilan.revenusCharges.charges

  const revenusItems = [
    { label: 'Salaires nets',         value: r.salaireNet },
    { label: 'BIC / BNC',             value: r.bicBnc },
    { label: 'Revenus fonciers',       value: r.revenusFonciers },
    { label: 'Dividendes',            value: r.dividendes },
    { label: 'Plus-values',           value: r.plusValues },
    { label: 'Pensions / retraites',  value: r.pensions },
    { label: 'Autres revenus',        value: r.autresRevenus },
  ].filter(item => item.value > 0)

  const chargesItems = [
    { label: 'Remboursements crédits', value: c.remboursementsCredit },
    { label: 'Charges de copropriété', value: c.chargesCopropriete },
    { label: 'Pension alimentaire',    value: c.pensionAlimentaire },
    { label: 'Autres charges fixes',   value: c.autresCharges },
  ].filter(item => item.value > 0)

  const solde = calc.capaciteEpargneMensuelle

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} docTitle="Bilan patrimonial" />
      <SectionHeading num="04" slug="Revenus &amp; Charges" title="Revenus &amp; capacité d’épargne"
        subtitle="Flux annuels du foyer — revenus, charges et solde mensuel disponible." />

      {/* KPI revenus */}
      <View style={{ ...s.kpiRow, marginBottom: 24 }}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>REVENUS ANNUELS</Text>
          <Text style={{ ...s.kpiValue, color: C.POS }}>{fmtEur(calc.revenusMensuelsTotaux * 12)}</Text>
          <Text style={s.kpiSub}>{fmtEur(calc.revenusMensuelsTotaux)} / mois</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>CHARGES ANNUELLES</Text>
          <Text style={{ ...s.kpiValue, color: C.INK }}>{fmtEur(calc.chargesMensuellesTotales * 12)}</Text>
          <Text style={s.kpiSub}>{fmtEur(calc.chargesMensuellesTotales)} / mois</Text>
        </View>
        <View style={{ ...s.kpiCard, borderLeftWidth: 2, borderLeftColor: solde >= 0 ? C.POS : C.NEG }}>
          <Text style={s.kpiLabel}>CAPACITÉ D’ÉPARGNE</Text>
          <Text style={{ ...s.kpiValue, color: solde >= 0 ? C.POS : C.NEG }}>{fmtEur(solde)}</Text>
          <Text style={s.kpiSub}>Par mois</Text>
        </View>
      </View>

      {/* Tableau revenus / charges côte à côte */}
      <View style={{ flexDirection: 'row', gap: 24, marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.subLabel}>DÉTAIL REVENUS ANNUELS</Text>
          <View style={s.table}>
            {revenusItems.map((item, i) => (
              <View key={i} style={s.tableRow}>
                <Text style={{ ...s.tableLabel, fontSize: 9 }}>{item.label}</Text>
                <Text style={{ ...s.tableValue, fontSize: 9, color: C.POS }}>{fmtEur(item.value)}</Text>
              </View>
            ))}
            <View style={s.tableTotal}>
              <Text style={{ flex: 2, fontSize: 9, fontFamily: 'Helvetica-Bold' }}>Total annuel</Text>
              <Text style={{ flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.POS, textAlign: 'right' }}>
                {fmtEur(calc.revenusMensuelsTotaux * 12)}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={s.subLabel}>DÉTAIL CHARGES ANNUELLES</Text>
          <View style={s.table}>
            {chargesItems.map((item, i) => (
              <View key={i} style={s.tableRow}>
                <Text style={{ ...s.tableLabel, fontSize: 9 }}>{item.label}</Text>
                <Text style={{ ...s.tableValue, fontSize: 9, color: C.INK_MED }}>{fmtEur(item.value)}</Text>
              </View>
            ))}
            <View style={s.tableTotal}>
              <Text style={{ flex: 2, fontSize: 9, fontFamily: 'Helvetica-Bold' }}>Total annuel</Text>
              <Text style={{ flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.INK_MED, textAlign: 'right' }}>
                {fmtEur(calc.chargesMensuellesTotales * 12)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Revenus conjoint */}
      {bilan.revenusCharges.revenus.salaireNetConjoint > 0 && (
        <View style={{ ...s.callout, borderLeftColor: C.FOREST_2 }}>
          <Text style={{ ...s.calloutLabel, color: C.FOREST_2 }}>REVENUS DU CONJOINT</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 9.5, color: C.INK }}>Salaires nets</Text>
            <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.INK }}>
              {fmtEur(bilan.revenusCharges.revenus.salaireNetConjoint)}
            </Text>
          </View>
        </View>
      )}

      <PageFooter cabinet={cabinet} />
    </Page>
  )
}

// ─── Analyse fiscale & succession ────────────────────────────────────────────
function FiscalitePage({ bilan, calc, cabinet }: { bilan: BilanData; calc: BilanCalculations; cabinet: CabinetConfig }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const f = bilan.fiscalite

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} docTitle="Bilan patrimonial" />
      <SectionHeading num="05" slug="Fiscalité" title="Analyse fiscale &amp; succession"
        subtitle="Tranche marginale d’imposition, IFI et transmission." />

      {/* Cartes TMI / IFI / succession */}
      <View style={{ ...s.kpiRow, marginBottom: 24 }}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>TRANCHE MARGINALE</Text>
          <Text style={{ ...s.kpiValue, fontSize: 26 }}>{calc.tmi} %</Text>
          <Text style={s.kpiSub}>Taux marginal d’imposition</Text>
        </View>
        {calc.isAssujettisIFI ? (
          <View style={{ ...s.kpiCard, borderLeftWidth: 2, borderLeftColor: C.NEG }}>
            <Text style={{ ...s.kpiLabel, color: C.NEG }}>IFI ESTIMÉ</Text>
            <Text style={{ ...s.kpiValue, fontSize: 22, color: C.NEG }}>{fmtEur(calc.estimationIFI)}</Text>
            <Text style={s.kpiSub}>Assujetti à l’IFI</Text>
          </View>
        ) : (
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>IFI</Text>
            <Text style={{ ...s.kpiValue, fontSize: 16, color: C.POS }}>Non assujetti</Text>
            <Text style={s.kpiSub}>Seuil de 1 300 000 € non atteint</Text>
          </View>
        )}
        <View style={s.kpiCard}>
          <Text style={s.kpiLabel}>ACTIF SUCCESSORAL</Text>
          <Text style={{ ...s.kpiValue, fontSize: 16 }}>{fmtEur(calc.actifNetSuccessoral)}</Text>
          <Text style={s.kpiSub}>Base de calcul</Text>
        </View>
      </View>

      {/* Héritiers */}
      {f.heritiers.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={s.subLabel}>SUCCESSION ESTIMÉE</Text>
          <View style={s.table}>
            <View style={s.tableHead}>
              <Text style={{ ...s.tableHeadCell, flex: 2 }}>HÉRITIER</Text>
              <Text style={{ ...s.tableHeadCell, flex: 1, textAlign: 'right' }}>ABATTEMENT</Text>
            </View>
            {f.heritiers.map((h) => (
              <View key={h.id} style={s.tableRow}>
                <Text style={s.tableLabel}>{h.prenom || h.lien}</Text>
                <Text style={s.tableValue}>
                  {h.lien === 'conjoint' ? 'Exonéré' : fmtEur(h.abattementRestant)}
                </Text>
              </View>
            ))}
          </View>

          {calc.droitsSuccessionEstimes > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ fontSize: 9, color: C.INK_MED }}>
                Droits estimés — indicatif, ne se substitue pas au calcul notarial
              </Text>
              <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.INK }}>
                {fmtEur(calc.droitsSuccessionEstimes)}
              </Text>
            </View>
          )}
        </View>
      )}

      {f.strategieSuccession ? (
        <View style={{ ...s.callout, marginBottom: 14 }}>
          <Text style={s.calloutLabel}>STRATÉGIE DE SUCCESSION</Text>
          <Text style={s.calloutText}>{f.strategieSuccession}</Text>
        </View>
      ) : null}

      {f.observationsFiscales ? (
        <View style={s.callout}>
          <Text style={s.calloutLabel}>OBSERVATIONS FISCALES</Text>
          <Text style={s.calloutText}>{f.observationsFiscales}</Text>
        </View>
      ) : null}

      <PageFooter cabinet={cabinet} />
    </Page>
  )
}

// ─── Profil de risque MIF2 & Objectifs ───────────────────────────────────────
function ProfilObjectifsPage({ bilan, cabinet }: { bilan: BilanData; cabinet: CabinetConfig }) {
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
    '5_10ans': '5 à 10 ans', '5_10_ans': '5 à 10 ans', plus_10ans: 'Plus de 10 ans',
  }
  const EXP_LABELS: Record<string, string> = {
    debutant: 'Débutant', intermediaire: 'Intermédiaire',
    experimente: 'Expérimenté', expert: 'Expert',
  }
  const DELAI_LABELS: Record<string, string> = {
    moins_3ans: 'Moins de 3 ans', '3_5ans': '3 à 5 ans',
    '5_10ans': '5 à 10 ans', plus_10ans: 'Plus de 10 ans',
  }
  const CLASS_LABELS: Record<string, string> = {
    non_professionnel: 'Client non professionnel',
    professionnel: 'Client professionnel',
    contrepartie_eligible: 'Contrepartie éligible',
  }

  const profilColor = pr.resultat ? (PROFIL_COLORS[pr.resultat] || C.INK) : C.INK

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} docTitle="Bilan patrimonial" />
      <SectionHeading num="06" slug="Profil &amp; Objectifs" title="Profil de risque &amp; objectifs"
        subtitle="Questionnaire MIF 2 — classification investisseur et objectifs patrimoniaux." />

      {/* Profil MIF2 */}
      {pr.resultat ? (
        <View style={{ ...s.callout, marginBottom: 22 }}>
          <Text style={s.calloutLabel}>PROFIL MIF 2</Text>
          <Text style={{ fontFamily: 'Times-Roman', fontSize: 28, color: profilColor, marginBottom: 12, lineHeight: 1 }}>
            {PROFIL_LABELS[pr.resultat] || pr.resultat}
          </Text>
          <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
            {pr.objectif    && <Text style={{ fontSize: 8, color: C.INK_MED }}>Objectif : {OBJECTIF_LABELS[pr.objectif] || pr.objectif}</Text>}
            {pr.horizon     && <Text style={{ fontSize: 8, color: C.INK_MED }}>Horizon : {HORIZON_LABELS[pr.horizon] || pr.horizon}</Text>}
            {pr.experience  && <Text style={{ fontSize: 8, color: C.INK_MED }}>Expérience : {EXP_LABELS[pr.experience] || pr.experience}</Text>}
            {pr.classificationClient && <Text style={{ fontSize: 8, color: C.INK_MED }}>{CLASS_LABELS[pr.classificationClient] || pr.classificationClient}</Text>}
          </View>
          {pr.capacitePertes ? (() => {
            const PERTES_LABELS: Record<string, string> = {
              zero: 'Aucune perte acceptable (0 %)',
              dix: 'Jusqu’à -10 %',
              vingtcinq: 'Jusqu’à -25 %',
              cinquante: 'Jusqu’à -50 % ou plus',
              moins_10: 'Jusqu’à -10 %',
              moins_25: 'Jusqu’à -25 %',
              moins_50: 'Jusqu’à -50 % ou plus',
            }
            const label = PERTES_LABELS[pr.capacitePertes] || pr.capacitePertes.replace(/_/g, ' ').replace('pct', ' %')
            return (
              <Text style={{ fontSize: 8, color: C.INK_MED, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: C.BORDER }}>
                Capacité à supporter les pertes : {label}
              </Text>
            )
          })() : null}
        </View>
      ) : null}

      {/* Objectifs */}
      {objectifsSelected.length > 0 && (
        <View style={{ marginBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={s.subLabel}>OBJECTIFS PATRIMONIAUX</Text>
            {bilan.objectifs.preferencesESG && (
              <Text style={{ fontSize: 6.5, color: C.FOREST, letterSpacing: 1 }}>PRÉFÉRENCES ESG</Text>
            )}
          </View>
          <View style={s.table}>
            {objectifsSelected.map((obj, idx) => {
              const meta: string[] = []
              if (obj.montantCible > 0) meta.push(fmtEur(obj.montantCible))
              if (obj.delaiCible) meta.push(DELAI_LABELS[obj.delaiCible] || obj.delaiCible.replace(/_/g, ' '))
              return (
                <View key={obj.id} style={s.tableRow}>
                  <Text style={{ fontSize: 8, color: C.GOLD, marginRight: 14, width: 18, fontFamily: 'Helvetica-Bold' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9.5, color: C.INK }}>{obj.libelle}</Text>
                    {meta.length > 0 && (
                      <Text style={{ fontSize: 7.5, color: C.INK_MED, marginTop: 2 }}>{meta.join('  ·  ')}</Text>
                    )}
                  </View>
                  {obj.priorite ? (
                    <Text style={{ fontSize: 8, color: PRIORITE_COLORS[obj.priorite] || C.INK_LIGHT, fontFamily: 'Helvetica-Bold' }}>
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

      <PageFooter cabinet={cabinet} />
    </Page>
  )
}

// ─── Mentions légales & signature ─────────────────────────────────────────────
function MentionsPage({ bilan, cabinet }: { bilan: BilanData; cabinet: CabinetConfig }) {
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  const clientFull = [bilan.identite.civilite, bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ')
  const conseiller = [cabinet.prenomConseiller, cabinet.nomConseiller].filter(Boolean).join(' ')
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const nomCabinet = cabinet.nom || 'Charlie'

  return (
    <Page size="A4" style={s.page}>
      <PageHeader cabinet={cabinet} clientName={clientName} docTitle="Bilan patrimonial" />

      {bilan.objectifs.recommandations ? (
        <View style={{ marginBottom: 32 }}>
          <SectionHeading num="07" slug="Recommandations" title="Recommandations" />
          <Text style={{ fontSize: 10, color: C.INK, lineHeight: 1.8 }}>
            {bilan.objectifs.recommandations}
          </Text>
        </View>
      ) : (
        <SectionHeading num="07" slug="Mentions" title="Mentions réglementaires"
          subtitle="Informations légales et conditions d’utilisation du présent document." />
      )}

      {/* Bloc légal */}
      <View style={{ marginBottom: 28 }}>
        <Text style={{ fontSize: 9, color: C.INK, lineHeight: 1.7, marginBottom: 12 }}>
          {`Ce bilan patrimonial est destiné exclusivement à `}
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>{clientFull}</Text>
          {` et ne peut être transmis à des tiers sans autorisation préalable écrite de ${nomCabinet}.`}
        </Text>
        {cabinet.orias ? (
          <Text style={{ fontSize: 9, color: C.INK_MED, lineHeight: 1.7, marginBottom: 10 }}>
            {`${nomCabinet} — Conseiller en Gestion de Patrimoine immatriculé à l’ORIAS sous le numéro `}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{cabinet.orias}</Text>
            {` (www.orias.fr).`}
          </Text>
        ) : null}
        <Text style={{ fontSize: 9, color: C.INK_MED, lineHeight: 1.7 }}>
          {cabinet.mentionsLegalesPerso ||
            'Les informations contenues dans ce document sont fournies à titre indicatif. Elles ne constituent pas un conseil en investissement au sens de la directive MIF 2. Les performances passées ne préjugent pas des performances futures.'}
        </Text>
      </View>

      {/* Signatures */}
      <View style={{
        borderTopWidth: 0.5,
        borderTopColor: C.BORDER_DARK,
        paddingTop: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
        <View style={{ width: '44%' }}>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.INK, marginBottom: 36 }}>
            {nomCabinet.toUpperCase()}
          </Text>
          <View style={{ borderBottomWidth: 0.5, borderBottomColor: C.BORDER_DARK }} />
          <Text style={{ fontSize: 8.5, color: C.INK, marginTop: 6 }}>
            {conseiller || nomCabinet}
          </Text>
          {cabinet.fonction ? (
            <Text style={{ fontSize: 7.5, color: C.INK_MED }}>{cabinet.fonction}</Text>
          ) : null}
        </View>
        <View style={{ width: '44%' }}>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.INK, marginBottom: 36 }}>
            CACHET
          </Text>
          <View style={{ borderBottomWidth: 0.5, borderBottomColor: C.BORDER_DARK }} />
          <Text style={{ fontSize: 8, color: C.INK_LIGHT, marginTop: 6, fontStyle: 'italic' }}>
            {`Paris, le ${dateStr}`}
          </Text>
        </View>
      </View>

      <PageFooter cabinet={cabinet} />
    </Page>
  )
}

// ─── Document principal ───────────────────────────────────────────────────────
export interface BilanPDFProps {
  bilan: BilanData
  cabinet: CabinetConfig
  calculations: BilanCalculations
}

export function BilanPDF({ bilan, cabinet, calculations }: BilanPDFProps) {
  const nomClient = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Client'
  return (
    <Document
      title={`Bilan Patrimonial — ${nomClient}`}
      author={cabinet.nom || 'Charlie'}
      creator="Charlie Bilan Patrimonial"
      language="fr"
    >
      <CoverPage bilan={bilan} cabinet={cabinet} />
      <SynthesePage bilan={bilan} calc={calculations} cabinet={cabinet} />
      <InventairePage bilan={bilan} calc={calculations} cabinet={cabinet} />
      <RevenusPage bilan={bilan} calc={calculations} cabinet={cabinet} />
      <FiscalitePage bilan={bilan} calc={calculations} cabinet={cabinet} />
      <ProfilObjectifsPage bilan={bilan} cabinet={cabinet} />
      <MentionsPage bilan={bilan} cabinet={cabinet} />
    </Document>
  )
}

import type { BilanData, BilanCalculations, ProfilRisqueResultat } from './types'
import { BAREME_TMI_2024, BAREME_SUCCESSION_ENFANTS } from './constants'

const TYPES_LOCATIFS = ['locatif_nu', 'locatif_meuble', 'lmnp', 'scpi'] as const

export function calculateBilan(data: BilanData): BilanCalculations {
  // Total actif
  const totalActifImmobilier = data.actif.immobilier.reduce((sum, b) => sum + (b.valeurEstimee || 0), 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalActifFinancier = data.actif.financier.reduce((sum, a) => sum + (a.valeur || (a as any).valeurRachat || 0), 0)
  const totalActifProfessionnel = data.actif.professionnel.reduce((sum, a) => sum + (a.valeurEstimee || 0), 0)
  const totalActif = totalActifImmobilier + totalActifFinancier + totalActifProfessionnel

  // Total passif
  const totalPassif = data.passif.credits.reduce((sum, c) => sum + (c.capitalRestantDu || 0), 0) + (data.passif.autresDettes || 0)

  // Patrimoine net
  const patrimoineNet = totalActif - totalPassif

  // Monthly revenues (all sources)
  const r = data.revenusCharges.revenus
  const revenusMensuelsTotaux = (
    (r.salaireNet || 0) +
    (r.bicBnc || 0) +
    (r.revenusFonciers || 0) +
    (r.dividendes || 0) +
    (r.pensions || 0) +
    (r.autresRevenus || 0) +
    (r.avantagesNature || 0) +
    (r.salaireNetConjoint || 0) +
    (r.autresRevenusConjoint || 0)
  ) / 12

  const c = data.revenusCharges.charges
  const chargesMensuellesTotales = (
    (c.remboursementsCredit || 0) +
    (c.chargesCopropriete || 0) +
    (c.pensionAlimentaire || 0) +
    (c.autresCharges || 0)
  ) / 12

  const tauxEndettement = revenusMensuelsTotaux > 0
    ? (chargesMensuellesTotales / revenusMensuelsTotaux) * 100
    : 0

  const capaciteEpargneMensuelle = revenusMensuelsTotaux - chargesMensuellesTotales

  // Revenus foyer annuels (client + conjoint)
  const revenusFoyerAnnuels = (
    (r.salaireNet || 0) +
    (r.bicBnc || 0) +
    (r.revenusFonciers || 0) +
    (r.dividendes || 0) +
    (r.pensions || 0) +
    (r.autresRevenus || 0) +
    (r.avantagesNature || 0) +
    (r.salaireNetConjoint || 0) +
    (r.autresRevenusConjoint || 0)
  )

  // TMI
  const revenuParPart = data.fiscalite.nombrePartsQF > 0
    ? (data.fiscalite.revenuImposable || 0) / data.fiscalite.nombrePartsQF
    : (data.fiscalite.revenuImposable || 0)

  let tmi = 0
  for (const tranche of BAREME_TMI_2024) {
    if (revenuParPart > tranche.seuil) tmi = tranche.taux
  }

  // IFI auto-calculé
  const creditsImmo = data.passif.credits
    .filter(credit => credit.type === 'immobilier')
    .reduce((sum, credit) => sum + (credit.capitalRestantDu || 0), 0)
  const actifImmoNetAuto = totalActifImmobilier - creditsImmo
  // Override manuel si renseigné (> 0)
  const actifImmobilierNetIFI = (data.fiscalite.actifImmobilierNetIFI || 0) > 0
    ? data.fiscalite.actifImmobilierNetIFI
    : actifImmoNetAuto
  const isAssujettisIFI = actifImmobilierNetIFI >= 1_300_000

  let estimationIFI = 0
  if (isAssujettisIFI) {
    const net = actifImmobilierNetIFI
    if (net <= 1_300_000) {
      estimationIFI = 0
    } else if (net <= 2_570_000) {
      estimationIFI = (net - 800_000) * 0.005
    } else if (net <= 5_000_000) {
      estimationIFI = (1_300_000 - 800_000) * 0.005 + (net - 1_300_000) * 0.007
    } else if (net <= 10_000_000) {
      estimationIFI = (1_300_000 - 800_000) * 0.005 + (2_570_000 - 1_300_000) * 0.007 + (net - 2_570_000) * 0.01
    } else {
      estimationIFI = (1_300_000 - 800_000) * 0.005 + (2_570_000 - 1_300_000) * 0.007 + (5_000_000 - 2_570_000) * 0.01 + (net - 5_000_000) * 0.0125
    }
  }

  // Plus-value latente immobilière
  const plusValueLatenteTotale = data.actif.immobilier
    .filter(b => (b.prixAcquisition || 0) > 0)
    .reduce((sum, b) => sum + ((b.valeurEstimee || 0) - (b.prixAcquisition || 0)), 0)

  // Rendement locatif moyen
  const biensLocatifs = data.actif.immobilier.filter(b =>
    (TYPES_LOCATIFS as readonly string[]).includes(b.type)
  )
  const loyerAnnuelTotal = biensLocatifs.reduce((sum, b) => sum + (b.loyerMensuel || 0) * 12, 0)
  const valeurLocatifTotal = biensLocatifs.reduce((sum, b) => sum + (b.valeurEstimee || 0), 0)
  const rendementLocatifMoyen = valeurLocatifTotal > 0
    ? (loyerAnnuelTotal / valeurLocatifTotal) * 100
    : 0

  // Actif net successoral (AV hors succession par désignation)
  const totalAV = data.actif.financier
    .filter(a => a.type === 'assurance_vie')
    .reduce((sum, a) => sum + (a.valeur || 0), 0)
  const actifNetSuccessoral = patrimoineNet - totalAV

  // Droits de succession estimés
  const droitsSuccessionEstimes = estimerDroitsSuccession(actifNetSuccessoral, data)

  return {
    totalActifImmobilier,
    totalActifFinancier,
    totalActifProfessionnel,
    totalActif,
    totalPassif,
    patrimoineNet,
    tauxEndettement,
    capaciteEpargneMensuelle,
    revenusMensuelsTotaux,
    chargesMensuellesTotales,
    tmi,
    estimationIFI,
    isAssujettisIFI,
    plusValueLatenteTotale,
    rendementLocatifMoyen,
    revenusFoyerAnnuels,
    droitsSuccessionEstimes,
    actifNetSuccessoral,
  }
}

function estimerDroitsSuccession(actifNetSuccessoral: number, data: BilanData): number {
  const heritiers = data.fiscalite.heritiers
  const enfants = data.situationFamiliale.enfants

  // Use explicit heritiers list if defined, otherwise fall back to enfants from familiale
  const nbEnfants = heritiers.length > 0
    ? heritiers.filter(h => h.lien === 'enfant').length
    : enfants.length

  if (nbEnfants === 0) return 0

  const baseParEnfant = actifNetSuccessoral / nbEnfants
  const abattement = 100_000
  const taxable = Math.max(0, baseParEnfant - abattement)

  return nbEnfants * calculerBaremeSuccession(taxable)
}

function calculerBaremeSuccession(base: number): number {
  let impot = 0
  let reste = base
  for (let i = 0; i < BAREME_SUCCESSION_ENFANTS.length; i++) {
    const current = BAREME_SUCCESSION_ENFANTS[i]
    const next = BAREME_SUCCESSION_ENFANTS[i + 1]
    const trancheMax = next ? next.seuil - current.seuil : Infinity
    const montantTranche = Math.min(reste, trancheMax)
    if (montantTranche <= 0) break
    impot += montantTranche * (current.taux / 100)
    reste -= montantTranche
    if (reste <= 0) break
  }
  return impot
}

export function computeProfilRisque(data: BilanData): ProfilRisqueResultat {
  let score = 0
  const pr = data.profilRisque

  const objectifScores: Record<string, number> = { conservation: 1, revenu: 2, croissance: 3, speculation: 4 }
  score += objectifScores[pr.objectif] || 0

  const horizonScores: Record<string, number> = { moins_1an: 1, '1_3ans': 2, '3_5ans': 3, plus_5ans: 4 }
  score += horizonScores[pr.horizon] || 0

  const expScores: Record<string, number> = { debutant: 1, intermediaire: 2, experimente: 3, expert: 4 }
  score += expScores[pr.experience] || 0

  const pertesScores: Record<string, number> = { zero: 1, dix: 2, vingtcinq: 3, cinquante: 4 }
  score += pertesScores[pr.capacitePertes] || 0

  const reactionScores: Record<string, number> = { vendre_tout: 1, vendre_partie: 2, ne_rien_faire: 3, acheter_plus: 4 }
  score += reactionScores[pr.reactionBaisse] || 0

  const illiquiditeScores: Record<string, number> = { moins_10: 1, '10_30': 2, '30_60': 3, plus_60: 4 }
  score += illiquiditeScores[pr.toleranceIlliquidite] || 0

  // Max score = 24, min = 6
  if (score <= 10) return 'prudent'
  if (score <= 15) return 'equilibre'
  if (score <= 20) return 'dynamique'
  return 'offensif'
}

export function formatEuros(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)} %`
}

// Use in PDF to avoid U+202F → '/' bug with Helvetica font
export function fmtEurPdf(n: number): string {
  const abs = Math.round(Math.abs(n))
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (n < 0 ? '-' : '') + s + ' EUR'
}

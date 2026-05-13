import type { BilanData, BilanCalculations, ProfilRisqueResultat } from './types'
import { BAREME_TMI_2024 } from './constants'

export function calculateBilan(data: BilanData): BilanCalculations {
  // Total actif
  const totalActifImmobilier = data.actif.immobilier.reduce((sum, b) => sum + (b.valeurEstimee || 0), 0)
  const totalActifFinancier = data.actif.financier.reduce((sum, a) => sum + (a.valeur || 0), 0)
  const totalActifProfessionnel = data.actif.professionnel.reduce((sum, a) => sum + (a.valeurEstimee || 0), 0)
  const totalActif = totalActifImmobilier + totalActifFinancier + totalActifProfessionnel

  // Total passif
  const totalPassif = data.passif.credits.reduce((sum, c) => sum + (c.capitalRestantDu || 0), 0) + (data.passif.autresDettes || 0)

  // Patrimoine net
  const patrimoineNet = totalActif - totalPassif

  // Monthly revenues and charges
  const r = data.revenusCharges.revenus
  const revenusMensuelsTotaux = (
    (r.salaireNet || 0) +
    (r.bicBnc || 0) +
    (r.revenusFonciers || 0) +
    (r.dividendes || 0) +
    (r.pensions || 0) +
    (r.autresRevenus || 0)
  ) / 12

  const c = data.revenusCharges.charges
  const chargesMensuellesTotales = (
    (c.remboursementsCredit || 0) +
    (c.chargesCopropriete || 0) +
    (c.pensionAlimentaire || 0) +
    (c.autresCharges || 0)
  ) / 12

  // Debt ratio
  const tauxEndettement = revenusMensuelsTotaux > 0
    ? (chargesMensuellesTotales / revenusMensuelsTotaux) * 100
    : 0

  // Monthly savings capacity
  const capaciteEpargneMensuelle = revenusMensuelsTotaux - chargesMensuellesTotales

  // TMI calculation (based on revenu imposable / nb parts)
  const revenuParPart = data.fiscalite.nombrePartsQF > 0
    ? (data.fiscalite.revenuImposable || 0) / data.fiscalite.nombrePartsQF
    : (data.fiscalite.revenuImposable || 0)

  let tmi = 0
  for (const tranche of BAREME_TMI_2024) {
    if (revenuParPart > tranche.seuil) {
      tmi = tranche.taux
    }
  }

  // IFI calculation
  const actifImmobilierNetIFI = data.fiscalite.actifImmobilierNetIFI || totalActifImmobilier
  const isAssujettisIFI = actifImmobilierNetIFI >= 1_300_000

  let estimationIFI = 0
  if (isAssujettisIFI) {
    // Simplified IFI calculation
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
  }
}

// Compute profil de risque from MIF2 answers
export function computeProfilRisque(data: BilanData): ProfilRisqueResultat {
  let score = 0
  const pr = data.profilRisque

  // Objectif
  const objectifScores: Record<string, number> = {
    conservation: 1, revenu: 2, croissance: 3, speculation: 4
  }
  score += objectifScores[pr.objectif] || 0

  // Horizon
  const horizonScores: Record<string, number> = {
    moins_1an: 1, '1_3ans': 2, '3_5ans': 3, plus_5ans: 4
  }
  score += horizonScores[pr.horizon] || 0

  // Experience
  const expScores: Record<string, number> = {
    debutant: 1, intermediaire: 2, experimente: 3, expert: 4
  }
  score += expScores[pr.experience] || 0

  // Capacite pertes
  const pertesScores: Record<string, number> = {
    zero: 1, dix: 2, vingtcinq: 3, cinquante: 4
  }
  score += pertesScores[pr.capacitePertes] || 0

  // Reaction baisse
  const reactionScores: Record<string, number> = {
    vendre_tout: 1, vendre_partie: 2, ne_rien_faire: 3, acheter_plus: 4
  }
  score += reactionScores[pr.reactionBaisse] || 0

  // Max score = 20, min = 5
  if (score <= 8) return 'prudent'
  if (score <= 12) return 'equilibre'
  if (score <= 16) return 'dynamique'
  return 'offensif'
}

// Format currency for display
export function formatEuros(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format percentage
export function formatPct(value: number): string {
  return `${value.toFixed(1)} %`
}

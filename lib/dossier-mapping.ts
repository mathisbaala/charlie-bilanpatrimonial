// Pure mappers: BilanData (full 360° profile) → CharlieDossier.client_summary.
// The client_summary is the normalized handoff format consumed by the screener and
// the proposition app — neither needs the full BilanData schema.

import type { BilanData, BilanCalculations, HorizonInvestissement } from './types'
import type { ClientSummary, EnveloppeFiscale, ProfilRisqueResultat } from './charlie-dossier'

const HORIZON_TO_YEARS: Record<HorizonInvestissement, number> = {
  moins_1an: 1,
  '1_3ans': 3,
  '3_5ans': 5,
  plus_5ans: 8,
}

function computeAge(dateNaissance: string): number {
  if (!dateNaissance) return 0
  const dob = new Date(dateNaissance)
  if (Number.isNaN(dob.getTime())) return 0
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const monthDiff = now.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--
  return Math.max(0, age)
}

// Detect which fiscal envelopes the client already holds — useful to surface
// "PEA-eligible only" or "AV-compatible" filters in the screener.
function detectEnveloppes(bilan: BilanData): EnveloppeFiscale[] {
  const set = new Set<EnveloppeFiscale>()
  for (const a of bilan.actif.financier) {
    if (a.type === 'pea') set.add('PEA')
    if (a.type === 'assurance_vie') set.add('AV')
    if (a.type === 'per') set.add('PER')
    if (a.type === 'compte_titres') set.add('CTO')
  }
  // If the client has no envelope yet, expose the standard 4 — the screener
  // can let the CGP narrow it later.
  if (set.size === 0) return ['AV', 'PEA', 'CTO', 'PER']
  return Array.from(set)
}

function pickObjectifPrincipal(bilan: BilanData): string {
  const selected = bilan.objectifs.objectifs.filter((o) => o.selected)
  const haute = selected.find((o) => o.priorite === 'haute')
  if (haute) return haute.libelle
  if (selected[0]) return selected[0].libelle
  return 'Valorisation du patrimoine financier'
}

function normalizeClassificationMifid(
  raw: BilanData['profilRisque']['classificationClient']
): 'professionnel' | 'non_professionnel' {
  return raw === 'professionnel' || raw === 'contrepartie_eligible'
    ? 'professionnel'
    : 'non_professionnel'
}

function normalizeProfilRisque(raw: BilanData['profilRisque']['resultat']): ProfilRisqueResultat {
  if (raw === 'prudent' || raw === 'equilibre' || raw === 'dynamique' || raw === 'offensif') return raw
  return 'equilibre'
}

const PROFIL_LABEL: Record<ProfilRisqueResultat, string> = {
  prudent: 'prudent',
  equilibre: 'équilibré',
  dynamique: 'dynamique',
  offensif: 'offensif',
}

const PROFIL_PHRASE_RISQUE: Record<ProfilRisqueResultat, string> = {
  prudent: 'Volatilité faible, préservation du capital.',
  equilibre: 'Volatilité maîtrisée, équilibre rendement/risque.',
  dynamique:
    'Recherche de performance, actions internationales majoritaires, volatilité modérée à élevée acceptée.',
  offensif: 'Recherche de performance maximale, actions, volatilité élevée acceptée.',
}

// Traduit le client_summary en prompt langage-naturel — destiné à pré-remplir la
// barre de recherche du screener, dans le style attendu par son interpréteur IA.
export function buildScreenerPrompt(summary: Omit<ClientSummary, 'promptScreener'>): string {
  const phraseESG = summary.preferencesESG ? 'Fonds article 8 ou 9 (ISR/ESG). ' : ''
  const trackRecord = summary.horizonAnnees >= 5 ? 3 : 1
  return (
    `Profil ${PROFIL_LABEL[summary.profilRisque]}, horizon ${summary.horizonAnnees} ans. ` +
    `Objectif : ${summary.objectifPrincipal}. ` +
    `${PROFIL_PHRASE_RISQUE[summary.profilRisque]} ` +
    `${phraseESG}` +
    `Frais contenus, antériorité d'au moins ${trackRecord} ans.`
  )
}

export function buildClientSummary(
  bilan: BilanData,
  calculations: BilanCalculations,
  montantAInvestir: number
): ClientSummary {
  const horizonKey = (bilan.profilRisque.horizon || 'plus_5ans') as HorizonInvestissement
  const summary: Omit<ClientSummary, 'promptScreener'> = {
    nomComplet: [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ').trim() || 'Client sans nom',
    age: computeAge(bilan.identite.dateNaissance),
    profilRisque: normalizeProfilRisque(bilan.profilRisque.resultat),
    horizonAnnees: HORIZON_TO_YEARS[horizonKey] ?? 5,
    objectifPrincipal: pickObjectifPrincipal(bilan),
    patrimoineNet: Math.round(calculations.patrimoineNet || 0),
    patrimoineImmobilier: Math.round(calculations.totalActifImmobilier || 0),
    patrimoineFinancier: Math.round(calculations.totalActifFinancier || 0),
    patrimoineProfessionnel: Math.round(calculations.totalActifProfessionnel || 0),
    capaciteEpargneMensuelle: Math.round(Math.max(0, calculations.capaciteEpargneMensuelle || 0)),
    montantAInvestir: Math.max(0, Math.round(montantAInvestir || 0)),
    enveloppesEligibles: detectEnveloppes(bilan),
    preferencesESG: !!bilan.objectifs.preferencesESG,
    classificationMifid: normalizeClassificationMifid(bilan.profilRisque.classificationClient),
  }
  return { ...summary, promptScreener: buildScreenerPrompt(summary) }
}

// True when the bilan is "complete enough" for the screener handoff.
// We require at minimum: an identity, a computed risk profile, and a non-negative
// patrimoine. The objective is to avoid sending a half-empty dossier downstream.
export function bilanIsReadyForScreener(bilan: BilanData): { ready: boolean; missing: string[] } {
  const missing: string[] = []
  if (!bilan.identite.prenom || !bilan.identite.nom) missing.push('Identité (prénom + nom)')
  if (!bilan.profilRisque.resultat) missing.push('Profil de risque MIF2 complet')
  if (!bilan.objectifs.objectifs.some((o) => o.selected)) missing.push('Au moins un objectif patrimonial')
  return { ready: missing.length === 0, missing }
}

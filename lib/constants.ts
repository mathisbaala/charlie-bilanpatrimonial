import type { ObjectifPatrimonial, ParametresCabinet, BilanData } from './types'

export const OBJECTIFS_DEFAUT: Omit<ObjectifPatrimonial, 'selected' | 'priorite'>[] = [
  { id: 'retraite', libelle: 'Préparer la retraite' },
  { id: 'fiscalite', libelle: 'Optimiser la fiscalité' },
  { id: 'transmission', libelle: 'Transmettre le patrimoine' },
  { id: 'immobilier', libelle: 'Acquérir un bien immobilier' },
  { id: 'epargne', libelle: "Constituer une épargne de précaution" },
  { id: 'diversification', libelle: 'Diversifier les placements' },
  { id: 'conjoint', libelle: 'Protéger le conjoint' },
  { id: 'etudes', libelle: "Financer les études des enfants" },
]

export const PARAMETRES_CABINET_DEFAUT: ParametresCabinet = {
  nomCabinet: '',
  nomConseiller: '',
  prenomConseiller: '',
  numeroOrias: '',
  adresse: '',
  telephone: '',
  email: '',
  logo: '',
  mentionsLegales: 'Ce document est établi à titre informatif. Il ne constitue pas un conseil en investissement au sens de la réglementation MIF2.',
}

// Default empty bilan
export function createBilanVide(): BilanData {
  return {
    id: crypto.randomUUID(),
    dateCreation: new Date().toISOString(),
    dateDerniereModification: new Date().toISOString(),
    identite: {
      civilite: '',
      nom: '',
      prenom: '',
      dateNaissance: '',
      nationalite: 'Française',
      situationProfessionnelle: '',
      adresse: '',
      codePostal: '',
      ville: '',
      email: '',
      telephone: '',
    },
    situationFamiliale: {
      statutMarital: '',
      regimeMatrimonial: '',
      nombreEnfants: 0,
      enfants: [],
      hasTestament: false,
      hasDonation: false,
      commentairesFamiliaux: '',
    },
    actif: {
      immobilier: [],
      financier: [],
      professionnel: [],
    },
    passif: {
      credits: [],
      autresDettes: 0,
      commentaires: '',
    },
    revenusCharges: {
      revenus: {
        salaireNet: 0,
        bicBnc: 0,
        revenusFonciers: 0,
        dividendes: 0,
        plusValues: 0,
        pensions: 0,
        autresRevenus: 0,
      },
      charges: {
        remboursementsCredit: 0,
        chargesCopropriete: 0,
        pensionAlimentaire: 0,
        autresCharges: 0,
      },
    },
    fiscalite: {
      revenuImposable: 0,
      nombrePartsQF: 1,
      hasIFI: false,
      actifImmobilierNetIFI: 0,
      observationsFiscales: '',
      strategieSuccession: '',
    },
    profilRisque: {
      objectif: '',
      horizon: '',
      experience: '',
      capacitePertes: '',
      reactionBaisse: '',
      resultat: '',
    },
    objectifs: {
      objectifs: OBJECTIFS_DEFAUT.map(o => ({ ...o, selected: false, priorite: '' as const })),
      commentaires: '',
      recommandations: '',
    },
  }
}

// Barème TMI 2024 (tranches IR)
export const BAREME_TMI_2024 = [
  { seuil: 0, taux: 0 },
  { seuil: 11294, taux: 11 },
  { seuil: 28797, taux: 30 },
  { seuil: 82341, taux: 41 },
  { seuil: 177106, taux: 45 },
]

// Barème IFI 2024
export const BAREME_IFI_2024 = [
  { seuil: 0, taux: 0 },
  { seuil: 800000, taux: 0 },      // no IFI below 800k
  { seuil: 1300000, taux: 0.5 },   // 0.5% from 800k to 1.3M
  { seuil: 2570000, taux: 0.7 },
  { seuil: 5000000, taux: 1.0 },
  { seuil: 10000000, taux: 1.25 },
  // above 10M: 1.5%
]

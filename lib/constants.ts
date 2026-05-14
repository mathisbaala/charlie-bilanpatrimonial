import type { ObjectifPatrimonial, ParametresCabinet, BilanData } from './types'

export const OBJECTIFS_DEFAUT: Omit<ObjectifPatrimonial, 'selected' | 'priorite' | 'montantCible' | 'delaiCible'>[] = [
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
      professionDetaille: '',
      adresse: '',
      codePostal: '',
      ville: '',
      paysResidenceFiscale: 'France',
      email: '',
      telephone: '',
      isPEP: false,
      descriptionPEP: '',
    },
    situationFamiliale: {
      statutMarital: '',
      regimeMatrimonial: '',
      dateUnion: '',
      conjoint: null,
      nombreEnfants: 0,
      enfants: [],
      hasTestament: false,
      typeTestament: '',
      dateTestament: '',
      hasDonation: false,
      donations: [],
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
        regimeFoncier: '',
        chargesFoncieresDed: 0,
        dividendes: 0,
        plusValues: 0,
        pensions: 0,
        autresRevenus: 0,
        avantagesNature: 0,
        salaireNetConjoint: 0,
        autresRevenusConjoint: 0,
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
      heritiers: [],
    },
    profilRisque: {
      objectif: '',
      horizon: '',
      experience: '',
      capacitePertes: '',
      reactionBaisse: '',
      toleranceIlliquidite: '',
      classificationClient: '',
      justificationClassification: '',
      revenuAnnuelConfirme: 0,
      patrimoineFinancierConfirme: 0,
      chargesFixesConfirmees: 0,
      resultat: '',
    },
    objectifs: {
      objectifs: OBJECTIFS_DEFAUT.map(o => ({ ...o, selected: false, priorite: '' as const, montantCible: 0, delaiCible: '' as const })),
      preferencesESG: false,
      commentaires: '',
      recommandations: '',
    },
  }
}

// Barème TMI 2024
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
  { seuil: 800000, taux: 0 },
  { seuil: 1300000, taux: 0.5 },
  { seuil: 2570000, taux: 0.7 },
  { seuil: 5000000, taux: 1.0 },
  { seuil: 10000000, taux: 1.25 },
]

// Barème droits succession enfants 2024
export const BAREME_SUCCESSION_ENFANTS = [
  { seuil: 0, taux: 5 },
  { seuil: 8072, taux: 10 },
  { seuil: 12109, taux: 15 },
  { seuil: 15932, taux: 20 },
  { seuil: 552324, taux: 30 },
  { seuil: 902838, taux: 40 },
  { seuil: 1805677, taux: 45 },
]

// Situation personnelle
export type Civilite = 'M.' | 'Mme' | 'Dr' | 'Me'
export type SituationProfessionnelle = 'salarie' | 'tns' | 'dirigeant' | 'retraite' | 'sans_emploi' | 'autre'

export interface Identite {
  civilite: Civilite | ''
  nom: string
  prenom: string
  dateNaissance: string
  lieuNaissance: string
  nationalite: string
  situationProfessionnelle: SituationProfessionnelle | ''
  professionDetaille: string           // ex: "Chirurgien, CHU Bordeaux"
  adresse: string
  codePostal: string
  ville: string
  paysResidenceFiscale: string         // défaut "France"
  email: string
  telephone: string
  isPEP: boolean                       // Personne Politiquement Exposée
  descriptionPEP: string               // visible si isPEP = true
}

// Situation familiale
export type StatutMarital = 'celibataire' | 'marie' | 'pacse' | 'concubinage' | 'divorce' | 'veuf'
export type RegimeMatrimonial = 'communaute_legale' | 'separation_biens' | 'communaute_universelle' | 'participation_acquets'

export interface Conjoint {
  prenom: string
  nom: string
  dateNaissance: string
  situationProfessionnelle: SituationProfessionnelle | ''
}

export interface Enfant {
  id: string
  prenom: string
  age: number
  aCharge: boolean
  lienParente: 'biologique' | 'adopte' | 'recompose' | ''
}

export interface Donation {
  id: string
  montant: number
  date: string
  beneficiaire: string
  type: 'manuel' | 'assurance_vie' | 'demembrement' | 'autre'
}

export interface SituationFamiliale {
  statutMarital: StatutMarital | ''
  regimeMatrimonial: RegimeMatrimonial | ''
  dateUnion: string                    // date mariage ou PACS
  conjoint: Conjoint | null
  nombreEnfants: number
  enfants: Enfant[]
  hasTestament: boolean
  typeTestament: 'olographe' | 'authentique' | ''
  dateTestament: string
  hasDonation: boolean
  donations: Donation[]
  commentairesFamiliaux: string
}

// Actif immobilier
export type TypeBienImmobilier = 'residence_principale' | 'locatif_nu' | 'locatif_meuble' | 'lmnp' | 'scpi' | 'opci' | 'terrain' | 'residence_secondaire' | 'autre'

export interface BienImmobilier {
  id: string
  type: TypeBienImmobilier
  libelle: string
  adresse?: string                     // localisation du bien (optionnel)
  valeurEstimee: number
  prixAcquisition: number              // pour plus-value latente
  dateAcquisition: string
  modeFinancement: 'comptant' | 'credit' | 'mixte' | ''
  surface: number                      // m²
  loyerMensuel: number                 // visible si type locatif
  regimeFiscalFoncier: 'micro' | 'reel' | ''
  chargesFoncieresDed: number          // si réel
  nombreParts?: number
  valeurLiquidative?: number
}

// Actif financier
export type TypeActifFinancier =
  | 'assurance_vie' | 'pea' | 'per' | 'compte_titres'
  | 'livret_a' | 'ldds' | 'lep'
  | 'pel' | 'cel'
  | 'crypto' | 'crowdfunding' | 'autre'

export interface ActifFinancier {
  id: string
  type: TypeActifFinancier
  libelle: string
  etablissement: string
  valeur: number
  dateOuverture: string
  beneficiaires: string
  originePER: 'volontaire' | 'entreprise' | 'mixte' | ''
  montantVersementsVolontairesPER: number
  tauxEuros: number                    // AV : % fonds euros
  tauxUC: number                       // AV : % UC
  modeGestion: 'libre' | 'pilotee' | 'profilee' | ''
  tauxRemunerationPEL: number          // PEL
}

// Actif professionnel
export interface ActifProfessionnel {
  id: string
  libelle: string
  type?: string                        // nature de l'actif pro (parts, fonds de commerce…)
  denomination?: string
  pourcentageDetention?: number
  valeurEstimee: number
  description: string
}

export interface Actif {
  immobilier: BienImmobilier[]
  financier: ActifFinancier[]
  professionnel: ActifProfessionnel[]
}

// Passif
export type TypeCredit = 'immobilier' | 'consommation' | 'professionnel' | 'autre'

export interface Credit {
  id: string
  type: TypeCredit
  libelle: string
  etablissement: string
  capitalRestantDu: number
  tauxInteret: number
  typeTaux: 'fixe' | 'variable' | 'mixte' | ''
  mensualite: number
  dateEcheance: string
  hasAssuranceEmprunteur: boolean
  tauxADE: number                      // taux assurance emprunteur
  couvertureADE: 'dc_ptia' | 'dc_ptia_itt' | 'tous_risques' | ''
  garantie: 'hypotheque' | 'caution' | 'ppd' | 'autre' | ''
}

export interface Passif {
  credits: Credit[]
  autresDettes: number
  commentaires: string
}

// Revenus & Charges
export interface Revenus {
  salaireNet: number
  bicBnc: number
  revenusFonciers: number
  regimeFoncier: 'micro' | 'reel' | ''
  chargesFoncieresDed: number
  dividendes: number
  plusValues: number
  pensions: number
  autresRevenus: number
  avantagesNature: number
  salaireNetConjoint: number
  autresRevenusConjoint: number
}

export interface Charges {
  remboursementsCredit: number
  chargesCopropriete: number
  pensionAlimentaire: number
  autresCharges: number
}

export interface RevenusCharges {
  revenus: Revenus
  charges: Charges
}

// Fiscalité
export interface Heritier {
  id: string
  lien: 'conjoint' | 'enfant' | 'petit_enfant' | 'autre'
  prenom: string
  abattementRestant: number            // défaut 100000 pour enfant, 31865 petit-enfant
}

export interface Fiscalite {
  revenuImposable: number
  nombrePartsQF: number
  hasIFI: boolean                      // legacy, conservé pour migration
  actifImmobilierNetIFI: number        // override manuel si > 0
  observationsFiscales: string
  strategieSuccession: string
  heritiers: Heritier[]
}

// Profil de risque MIF2
export type ObjectifInvestissement = 'conservation' | 'revenu' | 'croissance' | 'speculation'
export type HorizonInvestissement = 'moins_1an' | '1_3ans' | '3_5ans' | 'plus_5ans'
export type ExperienceInvestissement = 'debutant' | 'intermediaire' | 'experimente' | 'expert'
export type CapacitePertes = 'zero' | 'dix' | 'vingtcinq' | 'cinquante'
export type ReactionBaisse = 'vendre_tout' | 'vendre_partie' | 'ne_rien_faire' | 'acheter_plus'
export type ToleranceIlliquidite = 'moins_10' | '10_30' | '30_60' | 'plus_60'
export type ClassificationClient = 'non_professionnel' | 'professionnel' | 'contrepartie_eligible'
export type ProfilRisqueResultat = 'prudent' | 'equilibre' | 'dynamique' | 'offensif'

export interface ProfilRisque {
  objectif: ObjectifInvestissement | ''
  horizon: HorizonInvestissement | ''
  experience: ExperienceInvestissement | ''
  capacitePertes: CapacitePertes | ''
  reactionBaisse: ReactionBaisse | ''
  toleranceIlliquidite: ToleranceIlliquidite | ''
  classificationClient: ClassificationClient | ''
  justificationClassification: string
  revenuAnnuelConfirme: number
  patrimoineFinancierConfirme: number
  chargesFixesConfirmees: number
  resultat: ProfilRisqueResultat | ''
}

// Objectifs patrimoniaux
export type PrioriteObjectif = 'haute' | 'moyenne' | 'basse'
export type DelaiCible = 'moins_3ans' | '3_5ans' | '5_10ans' | 'plus_10ans'

export interface ObjectifPatrimonial {
  id: string
  libelle: string
  selected: boolean
  priorite: PrioriteObjectif | ''
  montantCible: number
  delaiCible: DelaiCible | ''
}

export interface ObjectifsSection {
  objectifs: ObjectifPatrimonial[]
  preferencesESG: boolean
  commentaires: string
  recommandations: string
}

// Paramètres Cabinet — type pivot partagé sur tout le parcours Charlie.
export type { CabinetConfig } from './charlie-dossier'

// The complete bilan data structure
export interface BilanData {
  id: string
  dateCreation: string
  dateDerniereModification: string
  identite: Identite
  situationFamiliale: SituationFamiliale
  actif: Actif
  passif: Passif
  revenusCharges: RevenusCharges
  fiscalite: Fiscalite
  profilRisque: ProfilRisque
  objectifs: ObjectifsSection
}

// For calculations
export interface BilanCalculations {
  totalActifImmobilier: number
  totalActifFinancier: number
  totalActifProfessionnel: number
  totalActif: number
  totalPassif: number
  patrimoineNet: number
  tauxEndettement: number
  capaciteEpargneMensuelle: number
  revenusMensuelsTotaux: number
  chargesMensuellesTotales: number
  tmi: number
  estimationIFI: number
  isAssujettisIFI: boolean
  plusValueLatenteTotale: number
  rendementLocatifMoyen: number
  revenusFoyerAnnuels: number
  droitsSuccessionEstimes: number
  actifNetSuccessoral: number
}

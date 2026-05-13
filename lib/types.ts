// Situation personnelle
export type Civilite = 'M.' | 'Mme' | 'Dr' | 'Me'
export type SituationProfessionnelle = 'salarie' | 'tns' | 'dirigeant' | 'retraite' | 'sans_emploi' | 'autre'

export interface Identite {
  civilite: Civilite | ''
  nom: string
  prenom: string
  dateNaissance: string  // ISO date string
  nationalite: string
  situationProfessionnelle: SituationProfessionnelle | ''
  adresse: string
  codePostal: string
  ville: string
  email: string
  telephone: string
}

// Situation familiale
export type StatutMarital = 'celibataire' | 'marie' | 'pacse' | 'concubinage' | 'divorce' | 'veuf'
export type RegimeMatrimonial = 'communaute_legale' | 'separation_biens' | 'communaute_universelle' | 'participation_acquets'

export interface Enfant {
  id: string
  age: number
  aCharge: boolean
}

export interface SituationFamiliale {
  statutMarital: StatutMarital | ''
  regimeMatrimonial: RegimeMatrimonial | ''  // only if marie or pacse
  nombreEnfants: number
  enfants: Enfant[]
  hasTestament: boolean
  hasDonation: boolean
  commentairesFamiliaux: string
}

// Actif immobilier
export type TypeBienImmobilier = 'residence_principale' | 'locatif_nu' | 'locatif_meuble' | 'lmnp' | 'scpi' | 'opci' | 'terrain' | 'residence_secondaire' | 'autre'

export interface BienImmobilier {
  id: string
  type: TypeBienImmobilier
  libelle: string
  valeurEstimee: number
  dateAcquisition: string
  modeFinancement: 'comptant' | 'credit' | 'mixte' | ''
  // for SCPI/OPCI
  nombreParts?: number
  valeurLiquidative?: number
}

// Actif financier
export type TypeActifFinancier = 'assurance_vie' | 'pea' | 'per' | 'compte_titres' | 'livret_a' | 'ldds' | 'lep' | 'crypto' | 'crowdfunding' | 'autre'

export interface ActifFinancier {
  id: string
  type: TypeActifFinancier
  libelle: string
  etablissement: string
  valeur: number
  dateOuverture?: string
  beneficiaires?: string  // for assurance-vie
  originePER?: 'volontaire' | 'entreprise' | 'mixte'  // for PER
}

// Actif professionnel
export interface ActifProfessionnel {
  id: string
  libelle: string
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
  mensualite: number
  dateEcheance: string
  hasAssuranceEmprunteur: boolean
}

export interface Passif {
  credits: Credit[]
  autresDettes: number  // other misc debts
  commentaires: string
}

// Revenus & Charges
export interface Revenus {
  salaireNet: number
  bicBnc: number  // self-employed income
  revenusFonciers: number
  dividendes: number
  plusValues: number
  pensions: number
  autresRevenus: number
}

export interface Charges {
  remboursementsCredit: number  // total monthly loan repayments
  chargesCopropriete: number
  pensionAlimentaire: number
  autresCharges: number
}

export interface RevenusCharges {
  revenus: Revenus
  charges: Charges
}

// Fiscalité
export type RegimeFiscal = 'ir_bareme' | 'ir_flat_tax' | 'is'

export interface Fiscalite {
  revenuImposable: number  // manually entered for TMI calc
  nombrePartsQF: number  // quotient familial
  hasIFI: boolean
  actifImmobilierNetIFI: number  // if hasIFI
  observationsFiscales: string  // free text for advisor
  strategieSuccession: string
}

// Profil de risque MIF2
export type ObjectifInvestissement = 'conservation' | 'revenu' | 'croissance' | 'speculation'
export type HorizonInvestissement = 'moins_1an' | '1_3ans' | '3_5ans' | 'plus_5ans'
export type ExperienceInvestissement = 'debutant' | 'intermediaire' | 'experimente' | 'expert'
export type CapacitePertes = 'zero' | 'dix' | 'vingtcinq' | 'cinquante'
export type ReactionBaisse = 'vendre_tout' | 'vendre_partie' | 'ne_rien_faire' | 'acheter_plus'
export type ProfilRisqueResultat = 'prudent' | 'equilibre' | 'dynamique' | 'offensif'

export interface ProfilRisque {
  objectif: ObjectifInvestissement | ''
  horizon: HorizonInvestissement | ''
  experience: ExperienceInvestissement | ''
  capacitePertes: CapacitePertes | ''
  reactionBaisse: ReactionBaisse | ''
  resultat: ProfilRisqueResultat | ''  // computed
}

// Objectifs patrimoniaux
export type PrioriteObjectif = 'haute' | 'moyenne' | 'basse'

export interface ObjectifPatrimonial {
  id: string
  libelle: string
  selected: boolean
  priorite: PrioriteObjectif | ''
}

export interface ObjectifsSection {
  objectifs: ObjectifPatrimonial[]
  commentaires: string
  recommandations: string  // free text for advisor (appears in PDF recommendations page)
}

// Paramètres Cabinet
export interface ParametresCabinet {
  nomCabinet: string
  nomConseiller: string
  prenomConseiller: string
  numeroOrias: string
  adresse: string
  telephone: string
  email: string
  logo: string  // base64 data URL
  mentionsLegales: string
}

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
  tmi: number  // percentage e.g. 30
  estimationIFI: number
  isAssujettisIFI: boolean
}

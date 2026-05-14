# Bilan Premium CGP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade charlie-bilanpatrimonial from MVP to a premium CGP tool with enriched data model, MIF2 compliance, auto-calculations (plus-value, rendement, IFI auto, droits succession), contextual tooltips, and a restructured 8-page PDF with signature block.

**Architecture:** Layered bottom-up: types → context/constants → calculations → UI components → PDF. Each layer depends on the previous. No backend — all localStorage with a migration function for backward compat.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, @react-pdf/renderer v4.5.1 (Helvetica only — fontkit WOFF bug), React Context + useReducer

---

## CRITICAL CONSTRAINTS (read before any task)

1. **PDF fonts**: Only `fontFamily: 'Helvetica'` — NO `Font.register()` calls. fontkit crashes on WOFF.
2. **PDF numbers**: Use `fmtEur()` helper (regex-based, ASCII space separator) — NOT `Intl.NumberFormat('fr-FR')` which produces U+202F → '/' in Helvetica.
3. **Dev server runs on port 3001** (3000 occupied by another Charlie app).
4. **localStorage migration**: `migrateData(stored)` in `BilanContext.tsx` merges missing fields with defaults — never breaks existing data.
5. **No external tooltip libs** — CSS/Tailwind only.

The existing `fmtEur` in `BilanPDF.tsx`:
```typescript
const fmtEur = (n: number): string => {
  const abs = Math.round(Math.abs(n))
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (n < 0 ? '-' : '') + s + ' €'
}
```

---

## Task 1: Update `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Replace the entire file** with the enriched types

```typescript
// Situation personnelle
export type Civilite = 'M.' | 'Mme' | 'Dr' | 'Me'
export type SituationProfessionnelle = 'salarie' | 'tns' | 'dirigeant' | 'retraite' | 'sans_emploi' | 'autre'

export interface Identite {
  civilite: Civilite | ''
  nom: string
  prenom: string
  dateNaissance: string
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

// Paramètres Cabinet
export interface ParametresCabinet {
  nomCabinet: string
  nomConseiller: string
  prenomConseiller: string
  numeroOrias: string
  adresse: string
  telephone: string
  email: string
  logo: string
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
  tmi: number
  estimationIFI: number
  isAssujettisIFI: boolean
  plusValueLatenteTotale: number
  rendementLocatifMoyen: number
  revenusFoyerAnnuels: number
  droitsSuccessionEstimes: number
  actifNetSuccessoral: number
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | head -40
```

Expected: errors only about missing new fields in `constants.ts` and `calculations.ts` — that's fine, those are next tasks.

- [ ] **Step 3: Commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
git add lib/types.ts
git commit -m "feat: enrich types — conjoint, donations, PEP, plus-value, MIF2 complet"
```

---

## Task 2: Update `lib/constants.ts` and `context/BilanContext.tsx`

**Files:**
- Modify: `lib/constants.ts`
- Modify: `context/BilanContext.tsx`

- [ ] **Step 1: Replace `lib/constants.ts`** with updated defaults matching new types

```typescript
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
```

- [ ] **Step 2: Add `migrateData` function** to `context/BilanContext.tsx`

Add this function after the imports and before `bilanReducer`:

```typescript
// Merges stored data with defaults so old localStorage data keeps working
function migrateData(stored: Partial<BilanData>): BilanData {
  const defaults = createBilanVide()
  return {
    ...defaults,
    ...stored,
    identite: { ...defaults.identite, ...stored.identite },
    situationFamiliale: {
      ...defaults.situationFamiliale,
      ...stored.situationFamiliale,
      conjoint: stored.situationFamiliale?.conjoint ?? null,
      donations: stored.situationFamiliale?.donations ?? [],
      enfants: (stored.situationFamiliale?.enfants ?? []).map(e => ({
        prenom: '',
        lienParente: '' as const,
        ...e,
      })),
    },
    actif: {
      immobilier: (stored.actif?.immobilier ?? []).map(b => ({
        prixAcquisition: 0,
        surface: 0,
        loyerMensuel: 0,
        regimeFiscalFoncier: '' as const,
        chargesFoncieresDed: 0,
        ...b,
      })),
      financier: (stored.actif?.financier ?? []).map(a => ({
        dateOuverture: '',
        beneficiaires: '',
        originePER: '' as const,
        montantVersementsVolontairesPER: 0,
        tauxEuros: 0,
        tauxUC: 0,
        modeGestion: '' as const,
        tauxRemunerationPEL: 0,
        ...a,
      })),
      professionnel: stored.actif?.professionnel ?? [],
    },
    passif: {
      ...defaults.passif,
      ...stored.passif,
      credits: (stored.passif?.credits ?? []).map(c => ({
        typeTaux: '' as const,
        garantie: '' as const,
        tauxADE: 0,
        couvertureADE: '' as const,
        ...c,
      })),
    },
    revenusCharges: {
      revenus: { ...defaults.revenusCharges.revenus, ...stored.revenusCharges?.revenus },
      charges: { ...defaults.revenusCharges.charges, ...stored.revenusCharges?.charges },
    },
    fiscalite: {
      ...defaults.fiscalite,
      ...stored.fiscalite,
      heritiers: stored.fiscalite?.heritiers ?? [],
    },
    profilRisque: { ...defaults.profilRisque, ...stored.profilRisque },
    objectifs: {
      ...defaults.objectifs,
      ...stored.objectifs,
      objectifs: defaults.objectifs.objectifs.map(defaultObj => {
        const existing = stored.objectifs?.objectifs?.find(o => o.id === defaultObj.id)
        return existing
          ? { ...defaultObj, ...existing }
          : defaultObj
      }),
    },
  }
}
```

- [ ] **Step 3: Update the localStorage load call** in `BilanContext.tsx`

Find the `useEffect` that loads from localStorage (around line 101) and change:
```typescript
// BEFORE:
dispatch({ type: 'LOAD', payload: JSON.parse(savedBilan) })
// AFTER:
dispatch({ type: 'LOAD', payload: migrateData(JSON.parse(savedBilan)) })
```

- [ ] **Step 4: Update `computeProfilRisque` dependency** in BilanContext.tsx

The existing `useEffect` for auto-computing profil risque checks 5 fields. Add `toleranceIlliquidite` to the condition:

Find (around line 142):
```typescript
    bilan.profilRisque.objectif &&
    bilan.profilRisque.horizon &&
    bilan.profilRisque.experience &&
    bilan.profilRisque.capacitePertes &&
    bilan.profilRisque.reactionBaisse
```
Replace with:
```typescript
    bilan.profilRisque.objectif &&
    bilan.profilRisque.horizon &&
    bilan.profilRisque.experience &&
    bilan.profilRisque.capacitePertes &&
    bilan.profilRisque.reactionBaisse &&
    bilan.profilRisque.toleranceIlliquidite
```
Also add `bilan.profilRisque.toleranceIlliquidite` to the dependency array.

- [ ] **Step 5: Verify**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | head -40
```

Expected: errors only in `calculations.ts` and section components (not yet updated).

- [ ] **Step 6: Commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
git add lib/constants.ts context/BilanContext.tsx
git commit -m "feat: update constants + context with migration function for new fields"
```

---

## Task 3: Update `lib/calculations.ts`

**Files:**
- Modify: `lib/calculations.ts`

- [ ] **Step 1: Replace the entire file** with enriched calculations

```typescript
import type { BilanData, BilanCalculations, ProfilRisqueResultat } from './types'
import { BAREME_TMI_2024, BAREME_SUCCESSION_ENFANTS } from './constants'

const TYPES_LOCATIFS = ['locatif_nu', 'locatif_meuble', 'lmnp', 'scpi'] as const

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

  // Monthly revenues
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

  // Revenus foyer annuels
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
    .filter(c => c.type === 'immobilier')
    .reduce((sum, c) => sum + (c.capitalRestantDu || 0), 0)
  const actifImmoNetAuto = totalActifImmobilier - creditsImmo
  // Override manuel si renseigné
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

  // Plus-value latente
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

  // Actif net successoral (AV hors succession)
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
  // If no heritiers defined, use enfants from situationFamiliale
  const enfants = data.situationFamiliale.enfants
  const hasConjoint = data.situationFamiliale.statutMarital === 'marie' || data.situationFamiliale.statutMarital === 'pacse'

  // If conjoint → actif successoral goes to enfants (conjoint exonéré)
  // Simplified: split equally among enfants
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

// Use these in PDF (avoids U+202F Helvetica bug):
export function fmtEurPdf(n: number): string {
  const abs = Math.round(Math.abs(n))
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return (n < 0 ? '-' : '') + s + ' EUR'
}
```

- [ ] **Step 2: Verify**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | head -40
```

Expected: errors only in section components (not yet updated).

- [ ] **Step 3: Commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
git add lib/calculations.ts
git commit -m "feat: add plusValueLatente, rendementLocatif, IFI auto, droits succession"
```

---

## Task 4: Create `components/ui/Tooltip.tsx`

**Files:**
- Create: `components/ui/Tooltip.tsx`

- [ ] **Step 1: Create the tooltip component**

```tsx
'use client'

interface TooltipProps {
  content: string
  className?: string
}

export function Tooltip({ content, className = '' }: TooltipProps) {
  return (
    <span className={`relative inline-flex items-center group ${className}`}>
      <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full border border-ink-300 text-ink-400 text-[10px] font-medium cursor-help select-none hover:border-gold hover:text-gold transition-colors">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-navy px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
        {content}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy" />
      </span>
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
git add components/ui/Tooltip.tsx
git commit -m "feat: add Tooltip component (CSS-only, no external deps)"
```

---

## Task 5: Update `components/sections/IdentiteSection.tsx`

**Files:**
- Modify: `components/sections/IdentiteSection.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/sections/IdentiteSection.tsx"
```

- [ ] **Step 2: Add 3 new fields**

After the `situationProfessionnelle` field, add:

```tsx
import { Tooltip } from '@/components/ui/Tooltip'

{/* Profession détaillée */}
<FormField label="Profession détaillée" htmlFor="professionDetaille">
  <input
    id="professionDetaille"
    type="text"
    placeholder="Ex: Chirurgien orthopédiste, CHU Bordeaux"
    value={bilan.identite.professionDetaille}
    onChange={e => updateIdentite({ professionDetaille: e.target.value })}
    className={inputClass}
  />
</FormField>
```

After `ville`, add:
```tsx
{/* Pays de résidence fiscale */}
<FormField label="Pays de résidence fiscale" htmlFor="paysResidenceFiscale">
  <input
    id="paysResidenceFiscale"
    type="text"
    value={bilan.identite.paysResidenceFiscale}
    onChange={e => updateIdentite({ paysResidenceFiscale: e.target.value })}
    className={inputClass}
  />
</FormField>
```

At the bottom of the form, add the PEP bloc:
```tsx
{/* PEP */}
<div className="pt-4 border-t border-parchment-200">
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={bilan.identite.isPEP}
      onChange={e => updateIdentite({ isPEP: e.target.checked })}
      className="w-4 h-4 rounded border-parchment-300 text-gold focus:ring-gold"
    />
    <span className="text-sm font-medium text-ink-700">
      Personne Politiquement Exposée (PEP)
    </span>
    <Tooltip content="Personne exerçant ou ayant exercé une fonction publique importante (ministre, élu, dirigeant d'État). Obligations KYC renforcées." />
  </label>
  {bilan.identite.isPEP && (
    <div className="mt-3">
      <FormField label="Description de la fonction" htmlFor="descriptionPEP">
        <textarea
          id="descriptionPEP"
          rows={2}
          placeholder="Ex: Ancien maire de Lyon (2010-2020)"
          value={bilan.identite.descriptionPEP}
          onChange={e => updateIdentite({ descriptionPEP: e.target.value })}
          className={`${inputClass} resize-none`}
        />
      </FormField>
    </div>
  )}
</div>
```

- [ ] **Step 3: Verify build**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | grep "IdentiteSection" | head -10
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
git add components/sections/IdentiteSection.tsx
git commit -m "feat(identite): add professionDetaille, paysResidenceFiscale, PEP bloc"
```

---

## Task 6: Update `components/sections/FamilialeSection.tsx`

**Files:**
- Modify: `components/sections/FamilialeSection.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/sections/FamilialeSection.tsx"
```

- [ ] **Step 2: Add dateUnion field** (visible if marié/pacsé)

After the `regimeMatrimonial` select (which is already conditional), add:
```tsx
{(sf.statutMarital === 'marie' || sf.statutMarital === 'pacse') && (
  <FormField label="Date de mariage / PACS" htmlFor="dateUnion">
    <input
      id="dateUnion"
      type="date"
      value={sf.dateUnion}
      onChange={e => updateFamiliale({ dateUnion: e.target.value })}
      className={inputClass}
    />
  </FormField>
)}
```

- [ ] **Step 3: Add Conjoint bloc** (visible if marié/pacsé/concubinage)

```tsx
{(sf.statutMarital === 'marie' || sf.statutMarital === 'pacse' || sf.statutMarital === 'concubinage') && (
  <div className="mt-6 p-4 bg-parchment-50 rounded-xl border border-parchment-200">
    <h3 className="text-sm font-semibold text-ink-700 mb-4">Conjoint / Partenaire</h3>
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Prénom" htmlFor="conjointPrenom">
        <input
          id="conjointPrenom"
          type="text"
          value={sf.conjoint?.prenom ?? ''}
          onChange={e => updateFamiliale({ conjoint: { ...(sf.conjoint ?? { nom: '', dateNaissance: '', situationProfessionnelle: '' }), prenom: e.target.value } })}
          className={inputClass}
        />
      </FormField>
      <FormField label="Nom" htmlFor="conjointNom">
        <input
          id="conjointNom"
          type="text"
          value={sf.conjoint?.nom ?? ''}
          onChange={e => updateFamiliale({ conjoint: { ...(sf.conjoint ?? { prenom: '', dateNaissance: '', situationProfessionnelle: '' }), nom: e.target.value } })}
          className={inputClass}
        />
      </FormField>
      <FormField label="Date de naissance" htmlFor="conjointDDN">
        <input
          id="conjointDDN"
          type="date"
          value={sf.conjoint?.dateNaissance ?? ''}
          onChange={e => updateFamiliale({ conjoint: { ...(sf.conjoint ?? { prenom: '', nom: '', situationProfessionnelle: '' }), dateNaissance: e.target.value } })}
          className={inputClass}
        />
      </FormField>
      <FormField label="Situation professionnelle" htmlFor="conjointSitPro">
        <select
          id="conjointSitPro"
          value={sf.conjoint?.situationProfessionnelle ?? ''}
          onChange={e => updateFamiliale({ conjoint: { ...(sf.conjoint ?? { prenom: '', nom: '', dateNaissance: '' }), situationProfessionnelle: e.target.value as SituationProfessionnelle | '' } })}
          className={selectClass}
        >
          <option value="">—</option>
          <option value="salarie">Salarié(e)</option>
          <option value="tns">TNS</option>
          <option value="dirigeant">Dirigeant(e)</option>
          <option value="retraite">Retraité(e)</option>
          <option value="sans_emploi">Sans emploi</option>
          <option value="autre">Autre</option>
        </select>
      </FormField>
    </div>
  </div>
)}
```

- [ ] **Step 4: Enrich each Enfant row** (add prenom + lienParente)

In the enfants map, add two fields per enfant:
```tsx
// Add prenom input before age
<input
  type="text"
  placeholder="Prénom"
  value={enfant.prenom}
  onChange={e => {
    const updated = sf.enfants.map(en => en.id === enfant.id ? { ...en, prenom: e.target.value } : en)
    updateFamiliale({ enfants: updated })
  }}
  className={`${inputClass} w-32`}
/>
// Add lienParente select after aCharge
<select
  value={enfant.lienParente}
  onChange={e => {
    const updated = sf.enfants.map(en => en.id === enfant.id ? { ...en, lienParente: e.target.value as 'biologique' | 'adopte' | 'recompose' | '' } : en)
    updateFamiliale({ enfants: updated })
  }}
  className={`${selectClass} w-36`}
>
  <option value="">Lien</option>
  <option value="biologique">Biologique</option>
  <option value="adopte">Adopté(e)</option>
  <option value="recompose">Recomposé</option>
</select>
```

- [ ] **Step 5: Add Testament enrichi** (typeTestament + dateTestament)

After the `hasTestament` checkbox, conditionally show:
```tsx
{sf.hasTestament && (
  <div className="ml-7 mt-3 grid grid-cols-2 gap-4">
    <FormField label="Type de testament" htmlFor="typeTestament">
      <select
        id="typeTestament"
        value={sf.typeTestament}
        onChange={e => updateFamiliale({ typeTestament: e.target.value as 'olographe' | 'authentique' | '' })}
        className={selectClass}
      >
        <option value="">—</option>
        <option value="olographe">Olographe (manuscrit)</option>
        <option value="authentique">Authentique (notaire)</option>
      </select>
    </FormField>
    <FormField label="Date du testament" htmlFor="dateTestament">
      <input
        id="dateTestament"
        type="date"
        value={sf.dateTestament}
        onChange={e => updateFamiliale({ dateTestament: e.target.value })}
        className={inputClass}
      />
    </FormField>
  </div>
)}
```

- [ ] **Step 6: Replace hasDonation toggle with structured donations list**

Replace the `hasDonation` checkbox section with:
```tsx
{/* Donations structurées */}
<div className="mt-6">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold text-ink-700">Donations antérieures</h3>
    <button
      type="button"
      onClick={() => {
        const newDonation = { id: crypto.randomUUID(), montant: 0, date: '', beneficiaire: '', type: 'manuel' as const }
        updateFamiliale({ hasDonation: true, donations: [...sf.donations, newDonation] })
      }}
      className="text-xs text-gold hover:text-gold-600 font-medium flex items-center gap-1"
    >
      + Ajouter une donation
    </button>
  </div>
  {sf.donations.length === 0 && (
    <p className="text-sm text-ink-400 italic">Aucune donation renseignée</p>
  )}
  {sf.donations.map(don => (
    <div key={don.id} className="mb-3 p-3 bg-parchment-50 rounded-lg border border-parchment-200">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Montant (€)" htmlFor={`don-montant-${don.id}`}>
          <input id={`don-montant-${don.id}`} type="number" min="0" value={don.montant || ''} onChange={e => updateFamiliale({ donations: sf.donations.map(d => d.id === don.id ? { ...d, montant: Number(e.target.value) } : d) })} className={inputClass} />
        </FormField>
        <FormField label="Date" htmlFor={`don-date-${don.id}`}>
          <input id={`don-date-${don.id}`} type="date" value={don.date} onChange={e => updateFamiliale({ donations: sf.donations.map(d => d.id === don.id ? { ...d, date: e.target.value } : d) })} className={inputClass} />
        </FormField>
        <FormField label="Bénéficiaire" htmlFor={`don-benef-${don.id}`}>
          <input id={`don-benef-${don.id}`} type="text" placeholder="Prénom Nom" value={don.beneficiaire} onChange={e => updateFamiliale({ donations: sf.donations.map(d => d.id === don.id ? { ...d, beneficiaire: e.target.value } : d) })} className={inputClass} />
        </FormField>
        <FormField label="Type" htmlFor={`don-type-${don.id}`}>
          <select id={`don-type-${don.id}`} value={don.type} onChange={e => updateFamiliale({ donations: sf.donations.map(d => d.id === don.id ? { ...d, type: e.target.value as 'manuel' | 'assurance_vie' | 'demembrement' | 'autre' } : d) })} className={selectClass}>
            <option value="manuel">Manuel</option>
            <option value="assurance_vie">Assurance-vie</option>
            <option value="demembrement">Démembrement</option>
            <option value="autre">Autre</option>
          </select>
        </FormField>
      </div>
      <button type="button" onClick={() => updateFamiliale({ donations: sf.donations.filter(d => d.id !== don.id) })} className="mt-2 text-xs text-red-400 hover:text-red-600">Supprimer</button>
    </div>
  ))}
</div>
```

- [ ] **Step 7: Verify and commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | grep "FamilialeSection" | head -10
git add components/sections/FamilialeSection.tsx
git commit -m "feat(familiale): conjoint, dateUnion, enfants enrichis, testament type, donations structurées"
```

---

## Task 7: Update `components/sections/ActifSection.tsx`

**Files:**
- Modify: `components/sections/ActifSection.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/sections/ActifSection.tsx"
```

- [ ] **Step 2: Add to each BienImmobilier row** — prixAcquisition + PV badge, surface, loyerMensuel + rendement badge, regimeFiscalFoncier + chargesFoncieresDed

In the immobilier section, after `valeurEstimee` field, add:
```tsx
import { Tooltip } from '@/components/ui/Tooltip'

{/* Prix d'acquisition */}
<FormField label={<span className="flex items-center">Prix d&apos;acquisition (€) <Tooltip content="Différence entre la valeur estimée actuelle et le prix d'acquisition. Non imposable tant que le bien n'est pas vendu." /></span>} htmlFor={`bien-prix-${bien.id}`}>
  <div className="relative">
    <input id={`bien-prix-${bien.id}`} type="number" min="0" value={bien.prixAcquisition || ''} onChange={e => updateBien(bien.id, { prixAcquisition: Number(e.target.value) })} className={inputClass} />
    {bien.prixAcquisition > 0 && (
      <span className={`absolute -bottom-5 right-0 text-xs font-medium ${(bien.valeurEstimee - bien.prixAcquisition) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        PV latente : {(bien.valeurEstimee - bien.prixAcquisition) >= 0 ? '+' : ''}{formatEuros(bien.valeurEstimee - bien.prixAcquisition)}
      </span>
    )}
  </div>
</FormField>

{/* Surface */}
<FormField label="Surface (m²)" htmlFor={`bien-surface-${bien.id}`}>
  <input id={`bien-surface-${bien.id}`} type="number" min="0" value={bien.surface || ''} onChange={e => updateBien(bien.id, { surface: Number(e.target.value) })} className={inputClass} />
</FormField>
```

For locatif/LMNP/SCPI types, conditionally add:
```tsx
{(['locatif_nu', 'locatif_meuble', 'lmnp', 'scpi'] as string[]).includes(bien.type) && (
  <>
    <FormField label={<span className="flex items-center">Loyer mensuel (€) <Tooltip content="Loyers annuels / valeur du bien. Ne tient pas compte des charges, vacances locatives et fiscalité." /></span>} htmlFor={`bien-loyer-${bien.id}`}>
      <div className="relative">
        <input id={`bien-loyer-${bien.id}`} type="number" min="0" value={bien.loyerMensuel || ''} onChange={e => updateBien(bien.id, { loyerMensuel: Number(e.target.value) })} className={inputClass} />
        {bien.loyerMensuel > 0 && bien.valeurEstimee > 0 && (
          <span className="absolute -bottom-5 right-0 text-xs font-medium text-gold">
            Rendement : {((bien.loyerMensuel * 12 / bien.valeurEstimee) * 100).toFixed(2)} %
          </span>
        )}
      </div>
    </FormField>
    <FormField label={<span className="flex items-center">Régime fiscal foncier <Tooltip content="Abattement forfaitaire de 30 % sur les loyers bruts. Plafonné à 15 000 €/an de revenus fonciers." /></span>} htmlFor={`bien-regime-${bien.id}`}>
      <select id={`bien-regime-${bien.id}`} value={bien.regimeFiscalFoncier} onChange={e => updateBien(bien.id, { regimeFiscalFoncier: e.target.value as 'micro' | 'reel' | '' })} className={selectClass}>
        <option value="">—</option>
        <option value="micro">Micro-foncier</option>
        <option value="reel">Réel</option>
      </select>
    </FormField>
    {bien.regimeFiscalFoncier === 'reel' && (
      <FormField label="Charges déductibles (€/an)" htmlFor={`bien-charges-${bien.id}`}>
        <input id={`bien-charges-${bien.id}`} type="number" min="0" value={bien.chargesFoncieresDed || ''} onChange={e => updateBien(bien.id, { chargesFoncieresDed: Number(e.target.value) })} className={inputClass} />
      </FormField>
    )}
  </>
)}
```

- [ ] **Step 3: Enrich ActifFinancier fields**

Add `pel` and `cel` to the type select options.

For each ActifFinancier, after `valeur` field, add:
```tsx
{/* Date d'ouverture — always visible */}
<FormField label="Date d'ouverture" htmlFor={`af-date-${actif.id}`}>
  <input id={`af-date-${actif.id}`} type="date" value={actif.dateOuverture} onChange={e => updateActifFinancier(actif.id, { dateOuverture: e.target.value })} className={inputClass} />
</FormField>

{/* AV specific fields */}
{actif.type === 'assurance_vie' && (
  <>
    <FormField label="% Fonds euros" htmlFor={`af-taux-eur-${actif.id}`}>
      <input id={`af-taux-eur-${actif.id}`} type="number" min="0" max="100" value={actif.tauxEuros || ''} onChange={e => updateActifFinancier(actif.id, { tauxEuros: Number(e.target.value), tauxUC: 100 - Number(e.target.value) })} className={inputClass} />
    </FormField>
    <FormField label="% Unités de compte" htmlFor={`af-taux-uc-${actif.id}`}>
      <input id={`af-taux-uc-${actif.id}`} type="number" min="0" max="100" value={actif.tauxUC || ''} readOnly className={`${inputClass} bg-parchment-100`} />
    </FormField>
    <FormField label="Mode de gestion" htmlFor={`af-mode-${actif.id}`}>
      <select id={`af-mode-${actif.id}`} value={actif.modeGestion} onChange={e => updateActifFinancier(actif.id, { modeGestion: e.target.value as 'libre' | 'pilotee' | 'profilee' | '' })} className={selectClass}>
        <option value="">—</option>
        <option value="libre">Libre</option>
        <option value="pilotee">Pilotée</option>
        <option value="profilee">Profilée</option>
      </select>
    </FormField>
    <FormField label="Bénéficiaires désignés" htmlFor={`af-benef-${actif.id}`}>
      <input id={`af-benef-${actif.id}`} type="text" value={actif.beneficiaires} onChange={e => updateActifFinancier(actif.id, { beneficiaires: e.target.value })} className={inputClass} />
    </FormField>
  </>
)}

{/* PER specific */}
{actif.type === 'per' && actif.originePER !== 'entreprise' && (
  <FormField label="Versements volontaires (€)" htmlFor={`af-vv-${actif.id}`}>
    <input id={`af-vv-${actif.id}`} type="number" min="0" value={actif.montantVersementsVolontairesPER || ''} onChange={e => updateActifFinancier(actif.id, { montantVersementsVolontairesPER: Number(e.target.value) })} className={inputClass} />
  </FormField>
)}

{/* PEL specific */}
{actif.type === 'pel' && (
  <FormField label="Taux de rémunération (%)" htmlFor={`af-taux-pel-${actif.id}`}>
    <input id={`af-taux-pel-${actif.id}`} type="number" min="0" step="0.01" value={actif.tauxRemunerationPEL || ''} onChange={e => updateActifFinancier(actif.id, { tauxRemunerationPEL: Number(e.target.value) })} className={inputClass} />
  </FormField>
)}
```

- [ ] **Step 4: Verify and commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | grep "ActifSection" | head -10
git add components/sections/ActifSection.tsx
git commit -m "feat(actif): prixAcquisition+PV badge, loyer+rendement badge, régime foncier, AV enrichi, PER versements, PEL taux"
```

---

## Task 8: Update `components/sections/PassifSection.tsx`

**Files:**
- Modify: `components/sections/PassifSection.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/sections/PassifSection.tsx"
```

- [ ] **Step 2: Add fields to each Credit row**

After `tauxInteret`, add:
```tsx
import { Tooltip } from '@/components/ui/Tooltip'

<FormField label="Type de taux" htmlFor={`credit-type-taux-${credit.id}`}>
  <select id={`credit-type-taux-${credit.id}`} value={credit.typeTaux} onChange={e => updateCredit(credit.id, { typeTaux: e.target.value as 'fixe' | 'variable' | 'mixte' | '' })} className={selectClass}>
    <option value="">—</option>
    <option value="fixe">Fixe</option>
    <option value="variable">Variable</option>
    <option value="mixte">Mixte</option>
  </select>
</FormField>

<FormField label="Garantie" htmlFor={`credit-garantie-${credit.id}`}>
  <select id={`credit-garantie-${credit.id}`} value={credit.garantie} onChange={e => updateCredit(credit.id, { garantie: e.target.value as 'hypotheque' | 'caution' | 'ppd' | 'autre' | '' })} className={selectClass}>
    <option value="">—</option>
    <option value="hypotheque">Hypothèque</option>
    <option value="caution">Caution</option>
    <option value="ppd">PPD</option>
    <option value="autre">Autre</option>
  </select>
</FormField>
```

After the `hasAssuranceEmprunteur` checkbox, conditionally add:
```tsx
{credit.hasAssuranceEmprunteur && (
  <div className="ml-7 mt-3 grid grid-cols-2 gap-4">
    <FormField label={<span className="flex items-center">Taux ADE (%) <Tooltip content="Assurance Décès Emprunteur. Prend en charge le remboursement du crédit en cas de décès, PTIA ou ITT selon la couverture." /></span>} htmlFor={`credit-taux-ade-${credit.id}`}>
      <input id={`credit-taux-ade-${credit.id}`} type="number" min="0" step="0.001" value={credit.tauxADE || ''} onChange={e => updateCredit(credit.id, { tauxADE: Number(e.target.value) })} className={inputClass} />
    </FormField>
    <FormField label="Couverture ADE" htmlFor={`credit-couverture-${credit.id}`}>
      <select id={`credit-couverture-${credit.id}`} value={credit.couvertureADE} onChange={e => updateCredit(credit.id, { couvertureADE: e.target.value as 'dc_ptia' | 'dc_ptia_itt' | 'tous_risques' | '' })} className={selectClass}>
        <option value="">—</option>
        <option value="dc_ptia">DC + PTIA</option>
        <option value="dc_ptia_itt">DC + PTIA + ITT</option>
        <option value="tous_risques">Tous risques</option>
      </select>
    </FormField>
  </div>
)}
```

- [ ] **Step 3: Verify and commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | grep "PassifSection" | head -10
git add components/sections/PassifSection.tsx
git commit -m "feat(passif): typeTaux, garantie, tauxADE, couvertureADE par crédit"
```

---

## Task 9: Update `components/sections/RevenusSection.tsx`

**Files:**
- Modify: `components/sections/RevenusSection.tsx`

- [ ] **Step 1: Read current file**

```bash
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/sections/RevenusSection.tsx"
```

- [ ] **Step 2: Add new revenus fields**

After `revenusFonciers`, add:
```tsx
import { Tooltip } from '@/components/ui/Tooltip'

{/* Régime foncier */}
{bilan.revenusCharges.revenus.revenusFonciers > 0 && (
  <>
    <FormField label={<span className="flex items-center">Régime foncier <Tooltip content="Abattement forfaitaire de 30 % sur les loyers bruts. Plafonné à 15 000 €/an de revenus fonciers." /></span>} htmlFor="regimeFoncier">
      <select id="regimeFoncier" value={bilan.revenusCharges.revenus.regimeFoncier} onChange={e => updateRevenusCharges({ revenus: { ...bilan.revenusCharges.revenus, regimeFoncier: e.target.value as 'micro' | 'reel' | '' } })} className={selectClass}>
        <option value="">—</option>
        <option value="micro">Micro-foncier</option>
        <option value="reel">Réel</option>
      </select>
    </FormField>
    {bilan.revenusCharges.revenus.regimeFoncier === 'reel' && (
      <FormField label="Charges déductibles foncières (€/an)" htmlFor="chargesFoncieresDed">
        <input id="chargesFoncieresDed" type="number" min="0" value={bilan.revenusCharges.revenus.chargesFoncieresDed || ''} onChange={e => updateRevenusCharges({ revenus: { ...bilan.revenusCharges.revenus, chargesFoncieresDed: Number(e.target.value) } })} className={inputClass} />
      </FormField>
    )}
  </>
)}
```

After `autresRevenus`, add:
```tsx
{/* Avantages en nature */}
<FormField label="Avantages en nature (€/an)" htmlFor="avantagesNature">
  <input id="avantagesNature" type="number" min="0" placeholder="Véhicule, logement de fonction..." value={bilan.revenusCharges.revenus.avantagesNature || ''} onChange={e => updateRevenusCharges({ revenus: { ...bilan.revenusCharges.revenus, avantagesNature: Number(e.target.value) } })} className={inputClass} />
</FormField>
```

Then add the Revenus du conjoint bloc (visible if conjoint is set):
```tsx
{bilan.situationFamiliale.conjoint && (
  <div className="mt-6 p-4 bg-parchment-50 rounded-xl border border-parchment-200">
    <h3 className="text-sm font-semibold text-ink-700 mb-4">
      Revenus du conjoint — {bilan.situationFamiliale.conjoint.prenom || 'Conjoint'}
    </h3>
    <div className="grid grid-cols-2 gap-4">
      <FormField label="Salaire net (€/an)" htmlFor="salaireNetConjoint">
        <input id="salaireNetConjoint" type="number" min="0" value={bilan.revenusCharges.revenus.salaireNetConjoint || ''} onChange={e => updateRevenusCharges({ revenus: { ...bilan.revenusCharges.revenus, salaireNetConjoint: Number(e.target.value) } })} className={inputClass} />
      </FormField>
      <FormField label="Autres revenus (€/an)" htmlFor="autresRevenusConjoint">
        <input id="autresRevenusConjoint" type="number" min="0" value={bilan.revenusCharges.revenus.autresRevenusConjoint || ''} onChange={e => updateRevenusCharges({ revenus: { ...bilan.revenusCharges.revenus, autresRevenusConjoint: Number(e.target.value) } })} className={inputClass} />
      </FormField>
    </div>
  </div>
)}
```

- [ ] **Step 3: Verify and commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | grep "RevenusSection" | head -10
git add components/sections/RevenusSection.tsx
git commit -m "feat(revenus): régime foncier, avantages nature, revenus conjoint"
```

---

## Task 10: Update `components/sections/FiscaliteSection.tsx`

**Files:**
- Modify: `components/sections/FiscaliteSection.tsx`

- [ ] **Step 1: Read current file**

```bash
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/sections/FiscaliteSection.tsx"
```

- [ ] **Step 2: Replace IFI toggle with auto-calculated bloc**

Remove the `hasIFI` checkbox and replace with:
```tsx
import { Tooltip } from '@/components/ui/Tooltip'

{/* IFI auto-calculé */}
<div className="mt-6 p-4 rounded-xl border border-parchment-200">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold text-ink-700 flex items-center gap-1">
      Impôt sur la Fortune Immobilière (IFI)
      <Tooltip content="Impôt sur la Fortune Immobilière. Déclenché si actif immobilier net > 1 300 000 €. Résidence principale : abattement 30 %." />
    </h3>
    {calculations.isAssujettisIFI ? (
      <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
        Assujetti IFI — {formatEuros(calculations.estimationIFI)}
      </span>
    ) : (
      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
        Non assujetti
      </span>
    )}
  </div>
  <p className="text-xs text-ink-400 mb-3">
    Base calculée : actif immobilier ({formatEuros(calculations.totalActifImmobilier)}) − crédits immobiliers
  </p>
  <FormField label="Ajuster la base IFI si nécessaire (€)" htmlFor="actifImmobilierNetIFI">
    <input
      id="actifImmobilierNetIFI"
      type="number"
      min="0"
      placeholder="Laisser vide pour calcul automatique"
      value={bilan.fiscalite.actifImmobilierNetIFI || ''}
      onChange={e => updateFiscalite({ actifImmobilierNetIFI: Number(e.target.value) })}
      className={inputClass}
    />
  </FormField>
</div>
```

- [ ] **Step 3: Add succession structurée section**

After the observationsFiscales textarea, add:
```tsx
{/* Succession structurée */}
<div className="mt-6 p-4 bg-parchment-50 rounded-xl border border-parchment-200">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold text-ink-700">Succession — héritiers présomptifs</h3>
    <button
      type="button"
      onClick={() => {
        const newHeritier = { id: crypto.randomUUID(), lien: 'enfant' as const, prenom: '', abattementRestant: 100000 }
        updateFiscalite({ heritiers: [...bilan.fiscalite.heritiers, newHeritier] })
      }}
      className="text-xs text-gold hover:text-gold-600 font-medium"
    >
      + Ajouter un héritier
    </button>
  </div>

  {bilan.fiscalite.heritiers.length === 0 && (
    <p className="text-sm text-ink-400 italic mb-3">
      Aucun héritier renseigné — calcul basé sur les enfants de la section Familiale
    </p>
  )}

  {bilan.fiscalite.heritiers.map(h => {
    const base = calculations.actifNetSuccessoral / Math.max(1, bilan.fiscalite.heritiers.length)
    const taxable = Math.max(0, base - h.abattementRestant)
    // Simplified display: 20% flat for estimate
    const droitsEstimes = h.lien === 'conjoint' ? 0 : taxable * 0.20
    return (
      <div key={h.id} className="mb-3 p-3 bg-white rounded-lg border border-parchment-200">
        <div className="grid grid-cols-3 gap-3 mb-2">
          <FormField label="Lien" htmlFor={`her-lien-${h.id}`}>
            <select id={`her-lien-${h.id}`} value={h.lien} onChange={e => updateFiscalite({ heritiers: bilan.fiscalite.heritiers.map(x => x.id === h.id ? { ...x, lien: e.target.value as 'conjoint' | 'enfant' | 'petit_enfant' | 'autre' } : x) })} className={selectClass}>
              <option value="conjoint">Conjoint</option>
              <option value="enfant">Enfant</option>
              <option value="petit_enfant">Petit-enfant</option>
              <option value="autre">Autre</option>
            </select>
          </FormField>
          <FormField label="Prénom" htmlFor={`her-prenom-${h.id}`}>
            <input id={`her-prenom-${h.id}`} type="text" value={h.prenom} onChange={e => updateFiscalite({ heritiers: bilan.fiscalite.heritiers.map(x => x.id === h.id ? { ...x, prenom: e.target.value } : x) })} className={inputClass} />
          </FormField>
          <FormField label="Abattement restant (€)" htmlFor={`her-abattement-${h.id}`}>
            <input id={`her-abattement-${h.id}`} type="number" min="0" value={h.abattementRestant} onChange={e => updateFiscalite({ heritiers: bilan.fiscalite.heritiers.map(x => x.id === h.id ? { ...x, abattementRestant: Number(e.target.value) } : x) })} className={inputClass} />
          </FormField>
        </div>
        {h.lien === 'conjoint' ? (
          <p className="text-xs text-green-600 font-medium">Exonéré de droits de succession</p>
        ) : (
          <p className="text-xs text-ink-500">
            Droits estimés (indicatifs) : <span className="font-semibold text-navy">{formatEuros(droitsEstimes)}</span>
          </p>
        )}
        <button type="button" onClick={() => updateFiscalite({ heritiers: bilan.fiscalite.heritiers.filter(x => x.id !== h.id) })} className="mt-1 text-xs text-red-400 hover:text-red-600">Supprimer</button>
      </div>
    )
  })}

  {calculations.droitsSuccessionEstimes > 0 && (
    <div className="mt-3 p-3 bg-navy/5 rounded-lg">
      <p className="text-sm font-semibold text-navy">
        Total droits estimés : {formatEuros(calculations.droitsSuccessionEstimes)}
      </p>
      <p className="text-xs text-ink-400 mt-1 italic">
        Estimation indicative — ne se substitue pas au calcul notarial
      </p>
    </div>
  )}
</div>
```

- [ ] **Step 4: Verify and commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | grep "FiscaliteSection" | head -10
git add components/sections/FiscaliteSection.tsx
git commit -m "feat(fiscalite): IFI auto-calculé, succession structurée avec héritiers"
```

---

## Task 11: Update `components/sections/ProfilRisqueSection.tsx`

**Files:**
- Modify: `components/sections/ProfilRisqueSection.tsx`

- [ ] **Step 1: Read current file**

```bash
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/sections/ProfilRisqueSection.tsx"
```

- [ ] **Step 2: Add classification client bloc** at the top of the form

```tsx
import { Tooltip } from '@/components/ui/Tooltip'

{/* Classification client MIF2 */}
<div className="p-4 bg-parchment-50 rounded-xl border border-parchment-200 mb-6">
  <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-1">
    Classification client
    <Tooltip content="Défaut : Non professionnel. La requalification en Professionnel nécessite de remplir 2 des 3 critères : portefeuille > 500K€, opérations significatives, expérience professionnelle." />
  </h3>
  <FormField label="Catégorie MIF2" htmlFor="classificationClient">
    <select id="classificationClient" value={bilan.profilRisque.classificationClient} onChange={e => updateProfilRisque({ classificationClient: e.target.value as 'non_professionnel' | 'professionnel' | 'contrepartie_eligible' | '' })} className={selectClass}>
      <option value="">—</option>
      <option value="non_professionnel">Client non professionnel</option>
      <option value="professionnel">Client professionnel</option>
      <option value="contrepartie_eligible">Contrepartie éligible</option>
    </select>
  </FormField>
  {bilan.profilRisque.classificationClient === 'professionnel' && (
    <FormField label="Justification de la requalification" htmlFor="justificationClassification">
      <textarea id="justificationClassification" rows={2} value={bilan.profilRisque.justificationClassification} onChange={e => updateProfilRisque({ justificationClassification: e.target.value })} className={`${inputClass} resize-none`} />
    </FormField>
  )}
</div>
```

- [ ] **Step 3: Add Question 6 — tolérance à l'illiquidité** after the 5th question (reactionBaisse)

```tsx
{/* Q6 — Tolérance illiquidité */}
<div className="mb-6">
  <label className="block text-sm font-medium text-ink-700 mb-3 flex items-center gap-1">
    Quelle part de votre patrimoine peut être bloquée sans possibilité de sortie immédiate ?
    <Tooltip content="Part du patrimoine pouvant être bloquée sans possibilité de sortie immédiate. Ouvre l'accès aux SCPI, private equity, FCPI." />
  </label>
  <div className="grid grid-cols-2 gap-3">
    {([
      ['moins_10', 'Moins de 10 %'],
      ['10_30', '10 à 30 %'],
      ['30_60', '30 à 60 %'],
      ['plus_60', 'Plus de 60 %'],
    ] as const).map(([val, label]) => (
      <label key={val} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${bilan.profilRisque.toleranceIlliquidite === val ? 'border-gold bg-gold/5' : 'border-parchment-200 hover:border-gold/50'}`}>
        <input type="radio" name="toleranceIlliquidite" value={val} checked={bilan.profilRisque.toleranceIlliquidite === val} onChange={() => updateProfilRisque({ toleranceIlliquidite: val })} className="sr-only" />
        <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${bilan.profilRisque.toleranceIlliquidite === val ? 'border-gold bg-gold' : 'border-parchment-300'}`} />
        <span className="text-sm text-ink-700">{label}</span>
      </label>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Add situation financière MIF2 confirmée bloc** at the bottom

```tsx
{/* Situation financière MIF2 confirmée */}
<div className="mt-6 p-4 bg-parchment-50 rounded-xl border border-parchment-200">
  <h3 className="text-sm font-semibold text-ink-700 mb-1">Situation financière MIF2 — à confirmer avec le client</h3>
  <p className="text-xs text-ink-400 mb-4">Données issues des sections Revenus et Actif — ajustez si nécessaire</p>
  <div className="grid grid-cols-3 gap-4">
    <FormField label="Revenu annuel confirmé (€)" htmlFor="revenuConfirme">
      <input id="revenuConfirme" type="number" min="0" value={bilan.profilRisque.revenuAnnuelConfirme || calculations.revenusFoyerAnnuels || ''} onChange={e => updateProfilRisque({ revenuAnnuelConfirme: Number(e.target.value) })} className={inputClass} />
    </FormField>
    <FormField label="Patrimoine financier (€)" htmlFor="patrimoineConfirme">
      <input id="patrimoineConfirme" type="number" min="0" value={bilan.profilRisque.patrimoineFinancierConfirme || calculations.totalActifFinancier || ''} onChange={e => updateProfilRisque({ patrimoineFinancierConfirme: Number(e.target.value) })} className={inputClass} />
    </FormField>
    <FormField label="Charges fixes (€/an)" htmlFor="chargesConfirmees">
      <input id="chargesConfirmees" type="number" min="0" value={bilan.profilRisque.chargesFixesConfirmees || (calculations.chargesMensuellesTotales * 12) || ''} onChange={e => updateProfilRisque({ chargesFixesConfirmees: Number(e.target.value) })} className={inputClass} />
    </FormField>
  </div>
</div>
```

- [ ] **Step 5: Verify and commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | grep "ProfilRisqueSection" | head -10
git add components/sections/ProfilRisqueSection.tsx
git commit -m "feat(profil-risque): Q6 illiquidité, classification MIF2, situation financière confirmée"
```

---

## Task 12: Update `components/sections/ObjectifsSection.tsx`

**Files:**
- Modify: `components/sections/ObjectifsSection.tsx`

- [ ] **Step 1: Read current file**

```bash
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/sections/ObjectifsSection.tsx"
```

- [ ] **Step 2: Add montantCible + delaiCible per selected objectif**

In the objectifs map, after the priorité select (visible when `selected`), add:
```tsx
{obj.selected && (
  <div className="mt-3 grid grid-cols-2 gap-3 pl-9">
    <FormField label="Montant cible (€, optionnel)" htmlFor={`obj-montant-${obj.id}`}>
      <input
        id={`obj-montant-${obj.id}`}
        type="number"
        min="0"
        placeholder="0"
        value={obj.montantCible || ''}
        onChange={e => {
          const updated = bilan.objectifs.objectifs.map(o =>
            o.id === obj.id ? { ...o, montantCible: Number(e.target.value) } : o
          )
          updateObjectifs({ objectifs: updated })
        }}
        className={inputClass}
      />
    </FormField>
    <FormField label="Délai cible" htmlFor={`obj-delai-${obj.id}`}>
      <select
        id={`obj-delai-${obj.id}`}
        value={obj.delaiCible}
        onChange={e => {
          const updated = bilan.objectifs.objectifs.map(o =>
            o.id === obj.id ? { ...o, delaiCible: e.target.value as 'moins_3ans' | '3_5ans' | '5_10ans' | 'plus_10ans' | '' } : o
          )
          updateObjectifs({ objectifs: updated })
        }}
        className={selectClass}
      >
        <option value="">—</option>
        <option value="moins_3ans">Moins de 3 ans</option>
        <option value="3_5ans">3 à 5 ans</option>
        <option value="5_10ans">5 à 10 ans</option>
        <option value="plus_10ans">Plus de 10 ans</option>
      </select>
    </FormField>
  </div>
)}
```

- [ ] **Step 3: Add ESG toggle** before the commentaires textarea

```tsx
{/* Préférences ESG */}
<div className="mt-6 p-4 bg-parchment-50 rounded-xl border border-parchment-200">
  <label className="flex items-center gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={bilan.objectifs.preferencesESG}
      onChange={e => updateObjectifs({ preferencesESG: e.target.checked })}
      className="w-4 h-4 rounded border-parchment-300 text-gold focus:ring-gold"
    />
    <span className="text-sm font-medium text-ink-700">
      Sensibilité ESG / Investissement responsable (ISR)
    </span>
  </label>
  {bilan.objectifs.preferencesESG && (
    <p className="mt-2 text-xs text-ink-500 ml-7">
      Le client souhaite que ses investissements intègrent des critères Environnementaux, Sociaux et de Gouvernance.
    </p>
  )}
</div>
```

- [ ] **Step 4: Verify and commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | grep "ObjectifsSection" | head -10
git add components/sections/ObjectifsSection.tsx
git commit -m "feat(objectifs): montantCible, delaiCible par objectif, toggle ESG"
```

---

## Task 13: Update `components/layout/Sidebar.tsx` — completion indicator

**Files:**
- Modify: `components/layout/Sidebar.tsx`

- [ ] **Step 1: Read current file**

```bash
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/layout/Sidebar.tsx"
```

- [ ] **Step 2: Add completion calculation function** inside the component (or as a pure helper above it)

```typescript
function computeSectionCompletude(sectionId: SectionId, bilan: BilanData): number {
  switch (sectionId) {
    case 'identite': {
      const fields = [bilan.identite.civilite, bilan.identite.nom, bilan.identite.prenom, bilan.identite.dateNaissance, bilan.identite.situationProfessionnelle]
      return Math.round(fields.filter(Boolean).length / fields.length * 100)
    }
    case 'familiale': {
      return bilan.situationFamiliale.statutMarital ? 100 : 0
    }
    case 'actif': {
      const hasImmo = bilan.actif.immobilier.length > 0
      const hasFinancier = bilan.actif.financier.length > 0
      return (hasImmo || hasFinancier) ? 100 : 0
    }
    case 'passif': {
      if (bilan.passif.credits.length === 0) return 100
      const complete = bilan.passif.credits.every(c => c.capitalRestantDu > 0 && c.mensualite > 0)
      return complete ? 100 : 50
    }
    case 'revenus': {
      const r = bilan.revenusCharges.revenus
      const hasAny = r.salaireNet > 0 || r.bicBnc > 0 || r.pensions > 0
      return hasAny ? 100 : 0
    }
    case 'fiscalite': {
      const fields = [bilan.fiscalite.revenuImposable > 0, bilan.fiscalite.nombrePartsQF > 0]
      return Math.round(fields.filter(Boolean).length / fields.length * 100)
    }
    case 'profil_risque': {
      const pr = bilan.profilRisque
      const answered = [pr.objectif, pr.horizon, pr.experience, pr.capacitePertes, pr.reactionBaisse, pr.toleranceIlliquidite, pr.classificationClient].filter(Boolean).length
      return Math.round(answered / 7 * 100)
    }
    case 'objectifs': {
      return bilan.objectifs.objectifs.some(o => o.selected) ? 100 : 0
    }
    default:
      return 0
  }
}
```

- [ ] **Step 3: Replace the current section status dot** with ProgressRing showing completude %

Import and use ProgressRing. In each nav item, replace whatever is currently showing section completion with:

```tsx
const completude = computeSectionCompletude(section.id as SectionId, bilan)
const ringColor = completude === 100 ? '#22c55e' : completude >= 66 ? '#A8874A' : completude >= 33 ? '#A8874A' : '#d1c5b0'

<ProgressRing percentage={completude} size={32} strokeWidth={3} color={ringColor}>
  <span className="text-[8px] font-bold" style={{ color: ringColor }}>{completude}%</span>
</ProgressRing>
```

- [ ] **Step 4: Verify and commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | grep "Sidebar" | head -10
git add components/layout/Sidebar.tsx
git commit -m "feat(sidebar): section completion % avec ProgressRing coloré"
```

---

## Task 14: Update `app/page.tsx` — dynamic header

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Read current file**

```bash
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/app/page.tsx"
```

- [ ] **Step 2: Add dynamic client name display**

In `app/page.tsx` (or wherever the main title is rendered), use:

```tsx
const { bilan } = useBilan()
const clientName = bilan.identite.prenom || bilan.identite.nom
  ? `${bilan.identite.prenom} ${bilan.identite.nom}`.trim()
  : 'Nouveau client'
```

Replace the static title/heading with:
```tsx
<h1 className="text-xl font-semibold text-ink-800">{clientName}</h1>
```

If the header is in `components/layout/Header.tsx`, make the same change there.

- [ ] **Step 3: Verify and commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | grep "page\|Header" | head -10
git add app/page.tsx components/layout/Header.tsx 2>/dev/null || git add app/page.tsx
git commit -m "feat(header): titre dynamique avec nom du client"
```

---

## Task 15: Update `components/pdf/PDFButtonInner.tsx` — pre-PDF modal

**Files:**
- Modify: `components/pdf/PDFButtonInner.tsx`

- [ ] **Step 1: Read current file**

```bash
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/pdf/PDFButtonInner.tsx"
```

- [ ] **Step 2: Add pre-PDF validation modal**

Add a `useState<boolean>(false)` for `showModal` and a `useState<boolean>(false)` for `bypassWarnings`.

Add a helper to compute alerts:
```typescript
function computeAlerts(bilan: BilanData, calculations: BilanCalculations) {
  const blocking: string[] = []
  const warnings: string[] = []

  // Blocking
  if (calculations.totalActif === 0)
    blocking.push('Aucun actif renseigné')
  if (bilan.fiscalite.revenuImposable === 0 && calculations.revenusMensuelsTotaux === 0)
    blocking.push('Revenu imposable et revenus mensuels = 0')
  const mif2Answered = [bilan.profilRisque.objectif, bilan.profilRisque.horizon, bilan.profilRisque.experience, bilan.profilRisque.capacitePertes, bilan.profilRisque.reactionBaisse, bilan.profilRisque.toleranceIlliquidite].filter(Boolean).length
  if (mif2Answered < 6)
    blocking.push(`Profil MIF2 incomplet (${mif2Answered}/6 questions)`)

  // Warnings
  const biensImmoSansPrix = bilan.actif.immobilier.filter(b => !b.prixAcquisition).length
  if (biensImmoSansPrix > 0)
    warnings.push(`Prix d'acquisition manquant sur ${biensImmoSansPrix} bien(s) immobilier(s)`)

  const biensLocatifsSansLoyer = bilan.actif.immobilier
    .filter(b => ['locatif_nu', 'locatif_meuble', 'lmnp', 'scpi'].includes(b.type))
    .filter(b => !b.loyerMensuel).length
  if (biensLocatifsSansLoyer > 0)
    warnings.push(`Loyer mensuel manquant sur ${biensLocatifsSansLoyer} bien(s) locatif(s)`)

  if (!bilan.profilRisque.classificationClient)
    warnings.push('Classification client MIF2 non renseignée')

  if (!bilan.objectifs.objectifs.some(o => o.selected))
    warnings.push('Aucun objectif patrimonial sélectionné')

  return { blocking, warnings }
}
```

Replace the current `onClick` handler with:
```tsx
const handleClick = () => {
  const { blocking, warnings } = computeAlerts(bilan, calculations)
  if (blocking.length > 0 || warnings.length > 0) {
    setShowModal(true)
  }
  // If no issues, proceed directly
}
```

Add the modal JSX before the PDFDownloadLink:
```tsx
{showModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
      <h2 className="text-lg font-semibold text-navy mb-4">Vérification avant génération</h2>

      {computeAlerts(bilan, calculations).blocking.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-red-600 mb-2">⚠ Points bloquants :</p>
          <ul className="space-y-1">
            {computeAlerts(bilan, calculations).blocking.map((alert, i) => (
              <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                <span className="mt-0.5">•</span> {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {computeAlerts(bilan, calculations).warnings.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-semibold text-amber-600 mb-2">Avertissements :</p>
          <ul className="space-y-1">
            {computeAlerts(bilan, calculations).warnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-600 flex items-start gap-2">
                <span className="mt-0.5">•</span> {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setShowModal(false)}
          className="flex-1 px-4 py-2 border border-parchment-300 rounded-xl text-sm font-medium text-ink-700 hover:bg-parchment-50"
        >
          Retourner corriger
        </button>
        <button
          onClick={() => { setShowModal(false); setBypassWarnings(true) }}
          className="flex-1 px-4 py-2 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90"
        >
          Générer quand même
        </button>
      </div>
    </div>
  </div>
)}
```

Show the PDFDownloadLink only when `bypassWarnings` is true OR `computeAlerts` returns no blocking issues.

- [ ] **Step 3: Verify and commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | grep "PDFButtonInner" | head -10
git add components/pdf/PDFButtonInner.tsx
git commit -m "feat(pdf): modale récap pré-PDF avec alertes bloquantes et avertissements"
```

---

## Task 16: Restructure `components/pdf/BilanPDF.tsx` — 8 pages

**Files:**
- Modify: `components/pdf/BilanPDF.tsx`

**CRITICAL REMINDER:**
- `fontFamily: 'Helvetica'` ONLY — no Font.register()
- Use `fmtEur()` for ALL monetary values (ASCII space separator)
- Keep existing camembert SVG logic

- [ ] **Step 1: Read the current file to understand its structure**

```bash
wc -l "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/pdf/BilanPDF.tsx"
cat "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial/components/pdf/BilanPDF.tsx"
```

- [ ] **Step 2: Add Page 2 — Identité & Famille** (new page, insert after Page 1 cover)

```tsx
{/* PAGE 2 — Identité & Situation familiale */}
<Page size="A4" style={styles.page}>
  <PageHeader cabinet={cabinet} title="Identité & Situation personnelle" pageNum={2} />

  {/* Informations personnelles */}
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Informations personnelles</Text>
    <View style={styles.table}>
      {[
        ['Civilité', data.identite.civilite],
        ['Nom', data.identite.nom],
        ['Prénom', data.identite.prenom],
        ['Date de naissance', data.identite.dateNaissance ? new Date(data.identite.dateNaissance).toLocaleDateString('fr-FR') : ''],
        ['Âge', data.identite.dateNaissance ? `${Math.floor((Date.now() - new Date(data.identite.dateNaissance).getTime()) / 31557600000)} ans` : ''],
        ['Nationalité', data.identite.nationalite],
        ['Pays résidence fiscale', data.identite.paysResidenceFiscale],
        ['Situation professionnelle', data.identite.situationProfessionnelle],
        ['Profession', data.identite.professionDetaille],
        ['Email', data.identite.email],
        ['Téléphone', data.identite.telephone],
      ].filter(([, v]) => v).map(([label, value], i) => (
        <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowEven : {}]}>
          <Text style={styles.tableLabelCell}>{label}</Text>
          <Text style={styles.tableValueCell}>{value}</Text>
        </View>
      ))}
    </View>
    {data.identite.isPEP && (
      <View style={[styles.badge, { backgroundColor: '#FEF3C7', marginTop: 6 }]}>
        <Text style={{ fontSize: 9, color: '#92400E' }}>PEP — {data.identite.descriptionPEP || 'Personne Politiquement Exposée'}</Text>
      </View>
    )}
  </View>

  {/* Conjoint */}
  {data.situationFamiliale.conjoint && (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Conjoint / Partenaire</Text>
      <View style={styles.table}>
        {[
          ['Prénom / Nom', `${data.situationFamiliale.conjoint.prenom} ${data.situationFamiliale.conjoint.nom}`],
          ['Date de naissance', data.situationFamiliale.conjoint.dateNaissance ? new Date(data.situationFamiliale.conjoint.dateNaissance).toLocaleDateString('fr-FR') : ''],
          ['Situation pro', data.situationFamiliale.conjoint.situationProfessionnelle],
          ['Régime matrimonial', data.situationFamiliale.regimeMatrimonial],
          ['Date union', data.situationFamiliale.dateUnion ? new Date(data.situationFamiliale.dateUnion).toLocaleDateString('fr-FR') : ''],
        ].filter(([, v]) => v).map(([label, value], i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowEven : {}]}>
            <Text style={styles.tableLabelCell}>{label}</Text>
            <Text style={styles.tableValueCell}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  )}

  {/* Enfants */}
  {data.situationFamiliale.enfants.length > 0 && (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Composition du foyer</Text>
      <View style={styles.table}>
        {data.situationFamiliale.enfants.map((e, i) => (
          <View key={e.id} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowEven : {}]}>
            <Text style={styles.tableLabelCell}>{e.prenom || `Enfant ${i + 1}`}</Text>
            <Text style={styles.tableValueCell}>{e.age} ans — {e.aCharge ? 'à charge' : 'non à charge'}</Text>
          </View>
        ))}
      </View>
    </View>
  )}

  {/* Testament & Donations */}
  {(data.situationFamiliale.hasTestament || data.situationFamiliale.donations.length > 0) && (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Documents & Dispositions</Text>
      {data.situationFamiliale.hasTestament && (
        <Text style={styles.bodyText}>
          Testament {data.situationFamiliale.typeTestament === 'olographe' ? 'olographe' : 'authentique (notarié)'}
          {data.situationFamiliale.dateTestament ? ` — ${new Date(data.situationFamiliale.dateTestament).toLocaleDateString('fr-FR')}` : ''}
        </Text>
      )}
      {data.situationFamiliale.donations.map((don, i) => (
        <Text key={i} style={styles.bodyText}>
          Donation {don.type} — {fmtEur(don.montant)} à {don.beneficiaire}
          {don.date ? ` (${new Date(don.date).toLocaleDateString('fr-FR')})` : ''}
        </Text>
      ))}
    </View>
  )}

  <PageFooter cabinet={cabinet} />
</Page>
```

- [ ] **Step 3: Enrich Page 3 (Actif/Passif)** — add PV latente KPI and columns

In the existing actif/passif page, after the existing KPIs row, add:
```tsx
{/* Plus-value latente KPI */}
{calculations.plusValueLatenteTotale !== 0 && (
  <View style={[styles.kpiCard, { backgroundColor: calculations.plusValueLatenteTotale >= 0 ? '#F0FDF4' : '#FEF2F2' }]}>
    <Text style={styles.kpiLabel}>Plus-value latente</Text>
    <Text style={[styles.kpiValue, { color: calculations.plusValueLatenteTotale >= 0 ? '#15803D' : '#DC2626' }]}>
      {calculations.plusValueLatenteTotale >= 0 ? '+' : ''}{fmtEur(calculations.plusValueLatenteTotale)}
    </Text>
  </View>
)}
```

In the immobilier table, add "PV Latente" and "Rendement" columns where applicable.

- [ ] **Step 4: Enrich Page 4 (Revenus)** — add revenus conjoint + foyer total badge

In the revenus page, after the client revenus table, add conjoint revenus if present. Add a foyer total badge.

- [ ] **Step 5: Enrich Page 5 (Fiscalité)** — IFI auto-calc + succession table

Replace static IFI section with auto-calculated block. Add succession table:
```tsx
{/* Succession */}
{data.fiscalite.heritiers.length > 0 && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Estimation droits de succession</Text>
    <View style={styles.table}>
      {data.fiscalite.heritiers.map((h, i) => (
        <View key={h.id} style={[styles.tableRow, i % 2 === 0 ? styles.tableRowEven : {}]}>
          <Text style={styles.tableLabelCell}>{h.prenom || h.lien}</Text>
          <Text style={styles.tableValueCell}>
            {h.lien === 'conjoint' ? 'Exonéré' : `Abattement ${fmtEur(h.abattementRestant)}`}
          </Text>
        </View>
      ))}
    </View>
    <View style={[styles.totalRow, { marginTop: 6 }]}>
      <Text style={styles.totalLabel}>Droits estimés total</Text>
      <Text style={styles.totalValue}>{fmtEur(calculations.droitsSuccessionEstimes)}</Text>
    </View>
    <Text style={[styles.bodyText, { color: '#6B7280', fontSize: 8, marginTop: 4 }]}>
      Estimation indicative — ne se substitue pas au calcul notarial
    </Text>
  </View>
)}
```

- [ ] **Step 6: Enrich Page 6 (Profil MIF2)** — add classification + Q6 + situation financière confirmée

Add classification badge at top. Add Q6 to the questions list. Add situation financière table at bottom.

- [ ] **Step 7: Enrich Page 7 (Objectifs)** — add montantCible, delaiCible, ESG badge

In the objectifs list, show montantCible and delaiCible when set. Add ESG badge if preferencesESG.

- [ ] **Step 8: Update Page 8 (Recommandations + Signatures)**

After the recommandations text, add the signatures block:
```tsx
{/* Signatures */}
<View style={{ marginTop: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E5E2D8' }}>
  <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Signatures</Text>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <View style={{ width: '45%' }}>
      <Text style={[styles.bodyText, { marginBottom: 30 }]}>Signature du client :</Text>
      <View style={{ borderBottomWidth: 1, borderBottomColor: '#081828', height: 1 }} />
      <Text style={[styles.bodyText, { marginTop: 4, fontSize: 8, color: '#6B7280' }]}>
        {data.identite.prenom} {data.identite.nom}
      </Text>
    </View>
    <View style={{ width: '45%' }}>
      <Text style={[styles.bodyText, { marginBottom: 30 }]}>Signature du conseiller :</Text>
      <View style={{ borderBottomWidth: 1, borderBottomColor: '#081828', height: 1 }} />
      <Text style={[styles.bodyText, { marginTop: 4, fontSize: 8, color: '#6B7280' }]}>
        {cabinet.prenomConseiller} {cabinet.nomConseiller}
      </Text>
    </View>
  </View>
  <Text style={[styles.bodyText, { marginTop: 16, fontSize: 8 }]}>
    Fait à _____________, le {new Date().toLocaleDateString('fr-FR')}
  </Text>
</View>
```

- [ ] **Step 9: Full build verification**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1 | head -40
npm run build 2>&1 | tail -20
```

Expected: zero TypeScript errors, build succeeds.

- [ ] **Step 10: Quick PDF smoke test**

```bash
# Start dev server in background
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npm run dev &
sleep 8
# Check it's running
curl -s http://localhost:3001 | grep -o '<html' | head -1
```

Open http://localhost:3001 in browser, fill in a test client name, click "Générer le PDF", verify 8 pages render.

- [ ] **Step 11: Commit**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
git add components/pdf/BilanPDF.tsx
git commit -m "feat(pdf): restructuration 8 pages — identité, succession, MIF2 enrichi, bloc signatures"
```

---

## Task 17: Final full build + smoke test

**Files:** None (verification only)

- [ ] **Step 1: TypeScript clean check**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npx tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 2: Production build**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npm run build 2>&1
```

Expected: `✓ Compiled successfully`

- [ ] **Step 3: Smoke test PDF** (verifies the two known bugs are not regressed)

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
npm run dev -- --port 3001 &
sleep 8
curl -s http://localhost:3001 | grep -c 'html'
```

Then in browser: fill basic client data → click Générer PDF → verify 8 pages, no '/' characters in numbers, no font errors in console.

- [ ] **Step 4: Final commit + push**

```bash
cd "/Users/mathisbaala/Projects/charlie annexes/charlie-bilanpatrimonial"
git push origin main
```

---

## Summary of files changed

| File | Task |
|------|------|
| `lib/types.ts` | 1 |
| `lib/constants.ts` | 2 |
| `context/BilanContext.tsx` | 2 |
| `lib/calculations.ts` | 3 |
| `components/ui/Tooltip.tsx` | 4 (new) |
| `components/sections/IdentiteSection.tsx` | 5 |
| `components/sections/FamilialeSection.tsx` | 6 |
| `components/sections/ActifSection.tsx` | 7 |
| `components/sections/PassifSection.tsx` | 8 |
| `components/sections/RevenusSection.tsx` | 9 |
| `components/sections/FiscaliteSection.tsx` | 10 |
| `components/sections/ProfilRisqueSection.tsx` | 11 |
| `components/sections/ObjectifsSection.tsx` | 12 |
| `components/layout/Sidebar.tsx` | 13 |
| `app/page.tsx` (or `Header.tsx`) | 14 |
| `components/pdf/PDFButtonInner.tsx` | 15 |
| `components/pdf/BilanPDF.tsx` | 16 |

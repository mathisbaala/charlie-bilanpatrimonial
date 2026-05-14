# Spec — Bilan Patrimonial Premium CGP

**Date :** 14 mai 2026  
**Statut :** Approuvé  
**Périmètre :** Refonte complète des 8 sections, enrichissement PDF, améliorations UX transversales

---

## Contexte

L'app charlie-bilanpatrimonial est fonctionnelle (8 sections, PDF 5 pages, localStorage). Un audit CGP senior a identifié trois catégories de lacunes : réglementaires (MIF2/LCB-FT), métier (champs manquants pour un bilan de qualité), et UX/PDF (rendu insuffisant pour un cabinet premium). Ce spec couvre la version complète.

L'outil est utilisé **par le CGP seul** pendant l'entretien — les labels peuvent être techniques.

---

## 1. Types TypeScript — `lib/types.ts`

### 1.1 Identité enrichie

```typescript
export interface Identite {
  // existant conservé
  civilite: Civilite | ''
  nom: string
  prenom: string
  dateNaissance: string
  nationalite: string
  situationProfessionnelle: SituationProfessionnelle | ''
  professionDetaille: string          // NOUVEAU — ex: "Chirurgien, CHU Bordeaux"
  adresse: string
  codePostal: string
  ville: string
  paysResidenceFiscale: string        // NOUVEAU — défaut "France"
  email: string
  telephone: string
  isPEP: boolean                      // NOUVEAU — Personne Politiquement Exposée
  descriptionPEP: string              // NOUVEAU — visible si isPEP = true
}
```

### 1.2 Situation familiale enrichie

```typescript
export interface Conjoint {           // NOUVEAU
  prenom: string
  nom: string
  dateNaissance: string
  situationProfessionnelle: SituationProfessionnelle | ''
}

export interface Enfant {
  id: string
  prenom: string                      // NOUVEAU
  age: number
  aCharge: boolean
  lienParente: 'biologique' | 'adopte' | 'recompose' | ''  // NOUVEAU
}

export interface Donation {           // NOUVEAU
  id: string
  montant: number
  date: string
  beneficiaire: string
  type: 'manuel' | 'assurance_vie' | 'demembrement' | 'autre'
}

export interface SituationFamiliale {
  statutMarital: StatutMarital | ''
  regimeMatrimonial: RegimeMatrimonial | ''
  dateUnion: string                   // NOUVEAU — date mariage ou PACS
  conjoint: Conjoint | null           // NOUVEAU
  nombreEnfants: number
  enfants: Enfant[]
  hasTestament: boolean
  typeTestament: 'olographe' | 'authentique' | ''   // NOUVEAU
  dateTestament: string               // NOUVEAU
  hasDonation: boolean
  donations: Donation[]               // NOUVEAU — remplace le simple toggle
  commentairesFamiliaux: string
}
```

### 1.3 Actif enrichi

```typescript
export interface BienImmobilier {
  id: string
  type: TypeBienImmobilier
  libelle: string
  valeurEstimee: number
  prixAcquisition: number             // NOUVEAU — pour plus-value latente
  dateAcquisition: string
  modeFinancement: 'comptant' | 'credit' | 'mixte' | ''
  surface: number                     // NOUVEAU — m²
  loyerMensuel: number                // NOUVEAU — visible si type locatif
  regimeFiscalFoncier: 'micro' | 'reel' | ''  // NOUVEAU — si locatif
  chargesFoncieresDed: number         // NOUVEAU — si réel
  nombreParts?: number
  valeurLiquidative?: number
}

// Nouveaux types financiers
export type TypeActifFinancier =
  | 'assurance_vie' | 'pea' | 'per' | 'compte_titres'
  | 'livret_a' | 'ldds' | 'lep'
  | 'pel' | 'cel'                     // NOUVEAU
  | 'crypto' | 'crowdfunding' | 'autre'

export interface ActifFinancier {
  id: string
  type: TypeActifFinancier
  libelle: string
  etablissement: string
  valeur: number
  dateOuverture: string               // existait, maintenant obligatoire dans UI
  beneficiaires: string
  originePER: 'volontaire' | 'entreprise' | 'mixte' | ''
  montantVersementsVolontairesPER: number  // NOUVEAU — déduction IR
  tauxEuros: number                   // NOUVEAU — AV : % fonds euros
  tauxUC: number                      // NOUVEAU — AV : % UC (= 100 - tauxEuros)
  modeGestion: 'libre' | 'pilotee' | 'profilee' | ''  // NOUVEAU — AV
  tauxRemunerationPEL: number         // NOUVEAU — PEL
}
```

### 1.4 Passif enrichi

```typescript
export interface Credit {
  id: string
  type: TypeCredit
  libelle: string
  etablissement: string
  capitalRestantDu: number
  tauxInteret: number
  typeTaux: 'fixe' | 'variable' | 'mixte' | ''  // NOUVEAU
  mensualite: number
  dateEcheance: string
  hasAssuranceEmprunteur: boolean
  tauxADE: number                     // NOUVEAU — taux assurance emprunteur
  couvertureADE: 'dc_ptia' | 'dc_ptia_itt' | 'tous_risques' | ''  // NOUVEAU
  garantie: 'hypotheque' | 'caution' | 'ppd' | 'autre' | ''      // NOUVEAU
}
```

### 1.5 Revenus enrichis

```typescript
export interface Revenus {
  salaireNet: number
  bicBnc: number
  revenusFonciers: number
  regimeFoncier: 'micro' | 'reel' | ''    // NOUVEAU
  chargesFoncieresDed: number              // NOUVEAU — si réel
  dividendes: number
  plusValues: number
  pensions: number
  autresRevenus: number
  avantagesNature: number                  // NOUVEAU — véhicule, logement de fonction
  // Conjoint
  salaireNetConjoint: number               // NOUVEAU
  autresRevenusConjoint: number            // NOUVEAU
}
```

### 1.6 Profil de risque MIF2 enrichi

```typescript
export type ClassificationClient = 'non_professionnel' | 'professionnel' | 'contrepartie_eligible'
export type ToleranceIlliquidite = 'moins_10' | '10_30' | '30_60' | 'plus_60'  // NOUVEAU

export interface ProfilRisque {
  // existant
  objectif: ObjectifInvestissement | ''
  horizon: HorizonInvestissement | ''
  experience: ExperienceInvestissement | ''
  capacitePertes: CapacitePertes | ''
  reactionBaisse: ReactionBaisse | ''
  // NOUVEAU
  toleranceIlliquidite: ToleranceIlliquidite | ''
  classificationClient: ClassificationClient | ''
  justificationClassification: string      // si professionnel
  // Situation financière MIF2 confirmée
  revenuAnnuelConfirme: number
  patrimoineFinancierConfirme: number
  chargesFixesConfirmees: number
  resultat: ProfilRisqueResultat | ''
}
```

### 1.7 Objectifs enrichis

```typescript
export type DelaiCible = 'moins_3ans' | '3_5ans' | '5_10ans' | 'plus_10ans'

export interface ObjectifPatrimonial {
  id: string
  libelle: string
  selected: boolean
  priorite: PrioriteObjectif | ''
  montantCible: number                // NOUVEAU — en euros/an pour retraite, total pour immo
  delaiCible: DelaiCible | ''         // NOUVEAU
}

export interface ObjectifsSection {
  objectifs: ObjectifPatrimonial[]
  preferencesESG: boolean             // NOUVEAU
  commentaires: string
  recommandations: string
}
```

### 1.8 Calculs enrichis

```typescript
export interface BilanCalculations {
  // existant
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
  // NOUVEAU
  plusValueLatenteTotale: number      // Σ (valeurEstimee - prixAcquisition) pour immobilier
  rendementLocatifMoyen: number       // loyer annuel total / valeur immo locatif
  revenusFoyerAnnuels: number         // client + conjoint
  droitsSuccessionEstimes: number     // estimation barème 2024
  actifNetSuccessoral: number         // patrimoineNet - AV (hors succession)
}
```

---

## 2. Calculs — `lib/calculations.ts`

### 2.1 Plus-value latente immobilière
```
plusValueLatente(bien) = bien.valeurEstimee - bien.prixAcquisition
plusValueLatenteTotale = Σ plusValueLatente pour tous biens où prixAcquisition > 0
```

### 2.2 Rendement locatif
```
rendementBrut(bien) = (bien.loyerMensuel * 12) / bien.valeurEstimee * 100
rendementLocatifMoyen = loyer annuel total / valeur totale biens locatifs
Biens locatifs = types: locatif_nu, locatif_meuble, lmnp, scpi
```

### 2.3 IFI automatique
```
actifImmoNetIFI = totalActifImmobilier - Σ capitalRestantDu (crédits immobiliers)
isAssujettisIFI = actifImmoNetIFI > 1_300_000
estimationIFI = barème IFI sur (actifImmoNetIFI - 800_000) si > 1_300_000
Barème IFI 2024:
  800K–1.3M: 0.5%
  1.3M–2.57M: 0.7%
  2.57M–5M: 1%
  5M–10M: 1.25%
  > 10M: 1.5%
```

### 2.4 Estimation droits de succession (indicative)
```
actifNetSuccessoral = patrimoineNet - Σ valeur AV (hors succession par désignation)
Par héritier : base taxable = actifNetSuccessoral / nb_héritiers - abattement
  Conjoint survivant : exonéré totalement
  Enfant : abattement 100 000 € (renouvelable tous les 15 ans)
  Petit-enfant : abattement 31 865 €
Barème enfants (après abattement) :
  ≤ 8 072 € : 5 %
  8 072–12 109 € : 10 %
  12 109–15 932 € : 15 %
  15 932–552 324 € : 20 %
  552 324–902 838 € : 30 %
  902 838–1 805 677 € : 40 %
  > 1 805 677 € : 45 %
Mention obligatoire : "Estimation indicative — ne se substitue pas au calcul notarial"
```

### 2.5 Revenus du foyer
```
revenusFoyerAnnuels = Σ revenus client + salaireNetConjoint + autresRevenusConjoint
```

---

## 3. Sections UI — modifications par section

### 3.1 IdentiteSection.tsx
- Ajouter `professionDetaille` (InputField, après situationProfessionnelle)
- Ajouter `paysResidenceFiscale` (InputField, défaut "France")
- Ajouter bloc PEP : ToggleField `isPEP` + si vrai → TextareaField `descriptionPEP`

### 3.2 FamilialeSection.tsx
- Ajouter `dateUnion` (InputField date, visible si marié/pacsé, label "Date de mariage / PACS")
- Bloc Conjoint : apparaît si statutMarital ∈ {marié, pacsé, concubinage} → 4 champs (prénom, nom, DDN, situation pro)
- Enfants : ajouter champ `prenom` + sélecteur `lienParente`
- Testament : ajouter `typeTestament` (SelectField) + `dateTestament` (date)
- Donations : remplacer le toggle simple par une liste de donations (bouton "+ Ajouter une donation" → 4 champs : montant, date, bénéficiaire, type)

### 3.3 ActifSection.tsx — onglet Immobilier
- Chaque bien : ajouter `prixAcquisition` (NumberInput, €) avec badge auto "PV latente : +X €" en vert/rouge
- Si type locatif/LMNP/SCPI : ajouter `loyerMensuel` (€/mois) avec badge "Rendement : X %"
- Si type locatif : ajouter `regimeFiscalFoncier` (micro / réel) + si réel → `chargesFoncieresDed`
- Ajouter `surface` (NumberInput, m², optionnel)

### 3.4 ActifSection.tsx — onglet Financier
- Ajouter PEL et CEL dans les options de type
- AV : afficher champs `tauxEuros` / `tauxUC` (sliders ou inputs %) + `modeGestion`
- PER : afficher `montantVersementsVolontairesPER` si originePER ≠ entreprise
- Rendre `dateOuverture` visible pour tous les types
- PEL : afficher `tauxRemunerationPEL`

### 3.5 PassifSection.tsx
- Chaque crédit : ajouter `typeTaux` (SelectField) + `garantie` (SelectField)
- Si `hasAssuranceEmprunteur` : afficher `tauxADE` (%) + `couvertureADE` (SelectField)

### 3.6 RevenusSection.tsx
- Revenus fonciers : ajouter `regimeFoncier` + si réel → `chargesFoncieresDed`
- Ajouter `avantagesNature` (NumberInput, €/an)
- Nouveau bloc "Revenus du conjoint" (visible si conjoint renseigné) : `salaireNetConjoint` + `autresRevenusConjoint`

### 3.7 FiscaliteSection.tsx
- **Supprimer** le toggle "Assujetti à l'IFI" — remplacer par un bloc auto-calculé :
  - Badge vert "Non assujetti" si actifImmoNet ≤ 1,3M€
  - Badge rouge "Assujetti IFI" avec montant estimé si > 1,3M€
  - Champ optionnel `actifImmobilierNetIFI` (override manuel) avec label "Ajuster la base IFI si nécessaire"
- **Nouvelle sous-section "Succession structurée"** :
  - Liste d'héritiers : `lien` (conjoint/enfant/petit-enfant/autre) + `prenom` + `abattementRestant` (€, défaut 100 000 pour enfant)
  - Affichage auto : "Droits estimés par héritier : X €" sous chaque ligne
  - Total droits estimés en bas + disclaimer "Estimation indicative"
  - Conserver le textarea "Stratégie de succession" pour les notes

### 3.8 ProfilRisqueSection.tsx
- Ajouter **Question 6** : tolérance à l'illiquidité (4 choix)
- Ajouter bloc **Classification client** en haut (SelectField + justification si pro)
- Ajouter bloc **Situation financière MIF2 confirmée** en bas :
  - 3 champs pré-remplis depuis les données existantes + bouton "Confirmer"
  - Label "Données issues des sections Revenus et Actif — à confirmer avec le client"

### 3.9 ObjectifsSection.tsx
- Chaque objectif sélectionné : afficher `montantCible` (NumberInput, optionnel) + `delaiCible` (SelectField)
- Ajouter toggle global `preferencesESG` "Sensibilité ESG / investissement responsable"

---

## 4. UX transversale

### 4.1 Header dynamique
`app/page.tsx` ou `Header.tsx` : le titre principal affiche `[Prénom] [Nom]` dès que ces champs sont remplis, sinon "Nouveau client". Mise à jour réactive via le contexte (déjà abonné).

### 4.2 Indicateur de complétude par section (Sidebar)
Remplacer les ronds vides/pleins par un **pourcentage de complétude** :
- Chaque section a une liste de champs "importants" définie statiquement
- `completude = champs remplis / champs importants * 100`
- Affichage : anneau SVG avec % dedans (utiliser le composant `ProgressRing` existant)
- Couleur : gris < 33%, or 33-66%, vert > 66%, vert foncé = 100%

Champs "importants" par section :
- Identité : civilite, nom, prenom, dateNaissance, situationProfessionnelle
- Familiale : statutMarital
- Actif : au moins 1 bien immobilier OU 1 actif financier
- Passif : si crédits → tous avec CRD et mensualité
- Revenus : salaireNet OU bicBnc OU pensions (au moins un)
- Fiscalité : revenuImposable, nombrePartsQF
- Profil risque : les 6 questions répondues + classificationClient
- Objectifs : au moins 1 objectif sélectionné

### 4.3 Tooltips contextuels
Composant `Tooltip` (nouveau) : icône `?` en `text-ink-400` inline après le label, au hover affiche une bulle.

Tooltips à ajouter :
- **QF (Quotient Familial)** : "1 part pour célibataire, 2 pour couple marié, +0,5 par enfant (1 part à partir du 3ème)"
- **TMI** : "Tranche applicable au dernier euro de revenu. Ne pas confondre avec le taux moyen d'imposition."
- **IFI** : "Impôt sur la Fortune Immobilière. Déclenché si actif immobilier net > 1 300 000 €. Résidence principale : abattement 30 %."
- **Régime micro-foncier** : "Abattement forfaitaire de 30 % sur les loyers bruts. Plafonné à 15 000 €/an de revenus fonciers."
- **PEP** : "Personne exerçant ou ayant exercé une fonction publique importante (ministre, élu, dirigeant d'État). Obligations KYC renforcées."
- **Plus-value latente** : "Différence entre la valeur estimée actuelle et le prix d'acquisition. Non imposable tant que le bien n'est pas vendu."
- **Rendement brut** : "Loyers annuels / valeur du bien. Ne tient pas compte des charges, vacances locatives et fiscalité."
- **ADE** : "Assurance Décès Emprunteur. Prend en charge le remboursement du crédit en cas de décès, PTIA ou ITT selon la couverture."
- **Classification MIF2** : "Défaut : Non professionnel. La requalification en Professionnel nécessite de remplir 2 des 3 critères : portefeuille > 500K€, opérations significatives, expérience professionnelle."
- **Tolérance illiquidité** : "Part du patrimoine pouvant être bloquée sans possibilité de sortie immédiate. Ouvre l'accès aux SCPI, private equity, FCPI."

### 4.4 Modale de récap pré-PDF
Avant le téléchargement (`PDFButtonInner.tsx`) : checker les données critiques manquantes.

Alertes critiques (bloquent avec option "Continuer quand même") :
- Aucun actif renseigné
- Revenu imposable = 0 et aucun revenu saisi
- Profil MIF2 incomplet (< 6 questions)

Avertissements (affichés mais non bloquants) :
- Prix d'acquisition manquant sur N biens immobiliers
- Loyer mensuel manquant sur N biens locatifs
- Classification client non renseignée
- Aucun objectif sélectionné

---

## 5. PDF restructuré — `components/pdf/BilanPDF.tsx`

### Structure 8 pages

**Page 1 — Couverture** (inchangée)

**Page 2 — Identité & Situation familiale** (NOUVELLE)
- Tableau "Informations personnelles" : civilité, nom, prénom, DDN, âge calculé, nationalité, pays résidence fiscale, situation pro, profession détaillée
- Si conjoint : tableau miroir "Conjoint / Partenaire" + date union + régime matrimonial
- Tableau "Composition du foyer" : enfants avec prénom et âge
- Bloc "Documents & Dispositions" : testament (type + date), donations (liste)
- Badge PEP si applicable

**Page 3 — Bilan Actif / Passif** (enrichi)
- KPIs existants + **Plus-value latente totale** (nouveau KPI)
- Tableau immobilier : ajout colonne "PV latente" et "Rendement" pour locatifs
- Tableau financier : ajout colonne "Date ouv." + répartition euros/UC pour AV
- Graphique camembert (conservé)

**Page 4 — Revenus & Capacité d'épargne** (enrichi)
- Tableau revenus : ajout ligne conjoint si applicable
- Tableau charges : inchangé
- KPIs : capacité épargne + taux endettement (existants)
- Badge "Revenus du foyer fiscal : X €/an"

**Page 5 — Analyse fiscale** (enrichie)
- Bloc TMI + IFI (enrichi : calcul automatique, base IFI)
- **Nouveau bloc Succession structurée** :
  - Tableau héritiers avec droits estimés par héritier
  - Total droits estimés
  - Disclaimer légal
- Stratégie de succession (textarea) + Observations fiscales

**Page 6 — Profil de risque MIF2** (enrichi)
- Classification client en badge
- Synthèse 6 réponses
- Résultat profil (existant)
- Tableau "Situation financière confirmée" : revenus, patrimoine, charges

**Page 7 — Objectifs patrimoniaux** (enrichi)
- Liste des objectifs avec priorité + montant cible + délai
- Badge ESG si applicable
- Commentaires client

**Page 8 — Recommandations + Signatures**
- Recommandations du conseiller (existant)
- **Nouveau bloc "Signatures"** :
  - "Fait à _____, le _____"
  - Ligne "Signature du client : ___________________"
  - Ligne "Signature du conseiller : ___________________"
  - Mention ORIAS (existant)
  - Mentions légales complètes

---

## 6. Ordre d'implémentation

1. `lib/types.ts` — Mettre à jour tous les types (fondation de tout le reste)
2. `context/BilanContext.tsx` — Mettre à jour le state initial + reducers
3. `lib/calculations.ts` — Ajouter plusValueLatente, rendementLocatif, IFI auto, succession
4. `components/ui/Tooltip.tsx` — Nouveau composant réutilisable
5. `components/sections/IdentiteSection.tsx` — PEP, pays résidence, profession détaillée
6. `components/sections/FamilialeSection.tsx` — Conjoint, enrichissement enfants, donations structurées
7. `components/sections/ActifSection.tsx` — Prix acquisition, loyer, régime foncier, PEL/CEL, AV enrichi
8. `components/sections/PassifSection.tsx` — typeTaux, garantie, ADE enrichi
9. `components/sections/RevenusSection.tsx` — Régime foncier, avantages nature, revenus conjoint
10. `components/sections/FiscaliteSection.tsx` — IFI auto, succession structurée
11. `components/sections/ProfilRisqueSection.tsx` — Q6 illiquidité, classification, situation financière MIF2
12. `components/sections/ObjectifsSection.tsx` — Montant cible, délai cible, ESG
13. `components/layout/Sidebar.tsx` — Indicateur complétude avec ProgressRing
14. `app/page.tsx` ou `Header.tsx` — Header dynamique (nom client temps réel)
15. `components/pdf/PDFButtonInner.tsx` — Modale récap pré-PDF
16. `components/pdf/BilanPDF.tsx` — Restructuration 8 pages complète

---

## 7. Contraintes techniques

- **Pas de breaking change sur le localStorage** : le contexte doit gérer la migration des données existantes (champs manquants → valeurs par défaut) via une fonction `migrateData(stored)` dans `BilanContext.tsx`
- **BilanPDF.tsx** utilise uniquement Helvetica (bug fontkit avec WOFF — voir note technique)
- **Tooltips** : CSS pur ou Tailwind, pas de librairie externe
- **Calcul IFI** : si `actifImmobilierNetIFI` override est renseigné (> 0), utiliser ce champ plutôt que le calculé auto
- **Calcul succession** : basé sur les enfants renseignés dans la section Familiale. Si 0 enfant → utiliser le conjoint comme seul héritier exonéré. Toujours afficher le disclaimer.
- **Indicateur complétude** : calculé en temps réel dans le contexte (mémoïsé), pas en localStorage

---

## 8. Hors scope

- Signature électronique (DocuSign, etc.) — juste une zone visuelle dans le PDF
- Calcul notarial de succession précis (DMTG avec toutes les règles)
- Multi-clients / comptes utilisateur
- Export Word / Excel
- Mode mobile (responsive basique conservé, pas de refonte mobile)

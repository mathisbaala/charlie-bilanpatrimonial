'use client'

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import type {
  BilanData,
  BilanCalculations,
  CabinetConfig,
  Identite,
  SituationFamiliale,
  Actif,
  Passif,
  RevenusCharges,
  Fiscalite,
  ProfilRisque,
  ObjectifsSection,
} from '@/lib/types'
import { createBilanVide, PARAMETRES_CABINET_DEFAUT } from '@/lib/constants'
import { calculateBilan, computeProfilRisque } from '@/lib/calculations'

const STORAGE_KEY_BILAN = 'charlie_bilan_data'

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
        ...e,
        prenom: e.prenom ?? '',
        lienParente: e.lienParente ?? ('' as const),
      })),
    },
    actif: {
      immobilier: (stored.actif?.immobilier ?? []).map(b => ({
        ...b,
        prixAcquisition: b.prixAcquisition ?? 0,
        surface: b.surface ?? 0,
        loyerMensuel: b.loyerMensuel ?? 0,
        regimeFiscalFoncier: b.regimeFiscalFoncier ?? ('' as const),
        chargesFoncieresDed: b.chargesFoncieresDed ?? 0,
      })),
      financier: (stored.actif?.financier ?? []).map(a => ({
        ...a,
        dateOuverture: a.dateOuverture ?? '',
        beneficiaires: a.beneficiaires ?? '',
        originePER: a.originePER ?? ('' as const),
        montantVersementsVolontairesPER: a.montantVersementsVolontairesPER ?? 0,
        tauxEuros: a.tauxEuros ?? 0,
        tauxUC: a.tauxUC ?? 0,
        modeGestion: a.modeGestion ?? ('' as const),
        tauxRemunerationPEL: a.tauxRemunerationPEL ?? 0,
      })),
      professionnel: stored.actif?.professionnel ?? [],
    },
    passif: {
      ...defaults.passif,
      ...stored.passif,
      credits: (stored.passif?.credits ?? []).map(c => ({
        ...c,
        typeTaux: c.typeTaux ?? ('' as const),
        garantie: c.garantie ?? ('' as const),
        tauxADE: c.tauxADE ?? 0,
        couvertureADE: c.couvertureADE ?? ('' as const),
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
const STORAGE_KEY_CABINET = 'charlie_cabinet_params'

// Fusionne le cabinet stocké avec les défauts et migre les anciens noms de
// champs (nomCabinet/numeroOrias/mentionsLegales) vers le modèle pivot unifié.
function migrateCabinet(stored: Record<string, unknown>): CabinetConfig {
  const s = stored as Partial<CabinetConfig> & {
    nomCabinet?: string
    numeroOrias?: string
    mentionsLegales?: string
  }
  return {
    ...PARAMETRES_CABINET_DEFAUT,
    ...s,
    nom: s.nom ?? s.nomCabinet ?? PARAMETRES_CABINET_DEFAUT.nom,
    orias: s.orias ?? s.numeroOrias ?? PARAMETRES_CABINET_DEFAUT.orias,
    mentionsLegalesPerso:
      s.mentionsLegalesPerso ?? s.mentionsLegales ?? PARAMETRES_CABINET_DEFAUT.mentionsLegalesPerso,
  }
}

export type SectionId =
  | 'identite'
  | 'familiale'
  | 'actif'
  | 'passif'
  | 'revenus'
  | 'fiscalite'
  | 'profil_risque'
  | 'objectifs'

// Actions for the reducer
type BilanAction =
  | { type: 'UPDATE_IDENTITE'; payload: Partial<Identite> }
  | { type: 'UPDATE_FAMILIALE'; payload: Partial<SituationFamiliale> }
  | { type: 'UPDATE_ACTIF'; payload: Partial<Actif> }
  | { type: 'UPDATE_PASSIF'; payload: Partial<Passif> }
  | { type: 'UPDATE_REVENUS_CHARGES'; payload: Partial<RevenusCharges> }
  | { type: 'UPDATE_FISCALITE'; payload: Partial<Fiscalite> }
  | { type: 'UPDATE_PROFIL_RISQUE'; payload: Partial<ProfilRisque> }
  | { type: 'UPDATE_OBJECTIFS'; payload: Partial<ObjectifsSection> }
  | { type: 'RESET' }
  | { type: 'LOAD'; payload: BilanData }

function bilanReducer(state: BilanData, action: BilanAction): BilanData {
  const now = new Date().toISOString()
  switch (action.type) {
    case 'UPDATE_IDENTITE':
      return { ...state, identite: { ...state.identite, ...action.payload }, dateDerniereModification: now }
    case 'UPDATE_FAMILIALE':
      return { ...state, situationFamiliale: { ...state.situationFamiliale, ...action.payload }, dateDerniereModification: now }
    case 'UPDATE_ACTIF':
      return { ...state, actif: { ...state.actif, ...action.payload }, dateDerniereModification: now }
    case 'UPDATE_PASSIF':
      return { ...state, passif: { ...state.passif, ...action.payload }, dateDerniereModification: now }
    case 'UPDATE_REVENUS_CHARGES':
      return { ...state, revenusCharges: { ...state.revenusCharges, ...action.payload }, dateDerniereModification: now }
    case 'UPDATE_FISCALITE':
      return { ...state, fiscalite: { ...state.fiscalite, ...action.payload }, dateDerniereModification: now }
    case 'UPDATE_PROFIL_RISQUE':
      return { ...state, profilRisque: { ...state.profilRisque, ...action.payload }, dateDerniereModification: now }
    case 'UPDATE_OBJECTIFS':
      return { ...state, objectifs: { ...state.objectifs, ...action.payload }, dateDerniereModification: now }
    case 'RESET':
      return createBilanVide()
    case 'LOAD':
      return action.payload
    default:
      return state
  }
}

interface BilanContextValue {
  bilan: BilanData
  calculations: BilanCalculations
  cabinet: CabinetConfig
  activeSection: SectionId
  setActiveSection: (section: SectionId) => void
  updateIdentite: (data: Partial<Identite>) => void
  updateFamiliale: (data: Partial<SituationFamiliale>) => void
  updateActif: (data: Partial<Actif>) => void
  updatePassif: (data: Partial<Passif>) => void
  updateRevenusCharges: (data: Partial<RevenusCharges>) => void
  updateFiscalite: (data: Partial<Fiscalite>) => void
  updateProfilRisque: (data: Partial<ProfilRisque>) => void
  updateObjectifs: (data: Partial<ObjectifsSection>) => void
  updateCabinet: (data: Partial<CabinetConfig>) => void
  resetBilan: () => void
}

const BilanContext = createContext<BilanContextValue | null>(null)

export function BilanProvider({ children }: { children: React.ReactNode }) {
  const [bilan, dispatch] = useReducer(bilanReducer, createBilanVide())
  const [cabinet, setCabinet] = useState<CabinetConfig>(PARAMETRES_CABINET_DEFAUT)
  const [activeSection, setActiveSection] = useState<SectionId>('identite')
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedBilan = localStorage.getItem(STORAGE_KEY_BILAN)
      if (savedBilan) {
        dispatch({ type: 'LOAD', payload: migrateData(JSON.parse(savedBilan)) })
      }
      const savedCabinet = localStorage.getItem(STORAGE_KEY_CABINET)
      if (savedCabinet) {
        setCabinet(migrateCabinet(JSON.parse(savedCabinet)))
      }
    } catch (e) {
      console.error('Failed to load from localStorage', e)
    }
    setHydrated(true)
  }, [])

  // Save bilan to localStorage on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY_BILAN, JSON.stringify(bilan))
    } catch (e) {
      console.error('Failed to save bilan to localStorage', e)
    }
  }, [bilan, hydrated])

  // Save cabinet to localStorage on every change
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY_CABINET, JSON.stringify(cabinet))
    } catch (e) {
      console.error('Failed to save cabinet to localStorage', e)
    }
  }, [cabinet, hydrated])

  const calculations = calculateBilan(bilan)

  // Auto-update profil risque result when answers change
  useEffect(() => {
    if (
      bilan.profilRisque.objectif &&
      bilan.profilRisque.horizon &&
      bilan.profilRisque.experience &&
      bilan.profilRisque.capacitePertes &&
      bilan.profilRisque.reactionBaisse &&
      bilan.profilRisque.toleranceIlliquidite
    ) {
      const resultat = computeProfilRisque(bilan)
      if (resultat !== bilan.profilRisque.resultat) {
        dispatch({ type: 'UPDATE_PROFIL_RISQUE', payload: { resultat } })
      }
    }
  }, [
    bilan.profilRisque.objectif,
    bilan.profilRisque.horizon,
    bilan.profilRisque.experience,
    bilan.profilRisque.capacitePertes,
    bilan.profilRisque.reactionBaisse,
    bilan.profilRisque.toleranceIlliquidite,
  ])

  const value: BilanContextValue = {
    bilan,
    calculations,
    cabinet,
    activeSection,
    setActiveSection,
    updateIdentite: (data) => dispatch({ type: 'UPDATE_IDENTITE', payload: data }),
    updateFamiliale: (data) => dispatch({ type: 'UPDATE_FAMILIALE', payload: data }),
    updateActif: (data) => dispatch({ type: 'UPDATE_ACTIF', payload: data }),
    updatePassif: (data) => dispatch({ type: 'UPDATE_PASSIF', payload: data }),
    updateRevenusCharges: (data) => dispatch({ type: 'UPDATE_REVENUS_CHARGES', payload: data }),
    updateFiscalite: (data) => dispatch({ type: 'UPDATE_FISCALITE', payload: data }),
    updateProfilRisque: (data) => dispatch({ type: 'UPDATE_PROFIL_RISQUE', payload: data }),
    updateObjectifs: (data) => dispatch({ type: 'UPDATE_OBJECTIFS', payload: data }),
    updateCabinet: (data) => setCabinet(prev => ({ ...prev, ...data })),
    resetBilan: () => dispatch({ type: 'RESET' }),
  }

  return (
    <BilanContext.Provider value={value}>
      {children}
    </BilanContext.Provider>
  )
}

export function useBilan(): BilanContextValue {
  const ctx = useContext(BilanContext)
  if (!ctx) throw new Error('useBilan must be used within BilanProvider')
  return ctx
}

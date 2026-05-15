// Charlie Dossier — shared pivot type and client SDK.
// Copy of this file lives in charlie-screener and charlie-propositioninvest.
// Differences across copies are kept minimal: only env-var access (Next.js vs Vite).

import type { BilanData, BilanCalculations } from './types'

export const CHARLIE_DOSSIER_SCHEMA_VERSION = 1

export type ProfilRisqueResultat = 'prudent' | 'equilibre' | 'dynamique' | 'offensif'
export type ParcoursStep = 'bilan' | 'screener' | 'proposition'
export type EnveloppeFiscale = 'PEA' | 'AV' | 'PER' | 'CTO'

export type BilanSnapshot = {
  bilanData: BilanData
  calculations: BilanCalculations
}

export type ClientSummary = {
  nomComplet: string
  age: number
  profilRisque: ProfilRisqueResultat
  horizonAnnees: number
  objectifPrincipal: string
  patrimoineNet: number
  patrimoineImmobilier: number
  patrimoineFinancier: number
  patrimoineProfessionnel: number
  capaciteEpargneMensuelle: number
  montantAInvestir: number
  enveloppesEligibles: EnveloppeFiscale[]
  preferencesESG: boolean
  classificationMifid: 'professionnel' | 'non_professionnel'
}

// Selection_fonds is unknown to the Bilan app — it never reads it.
export type SelectionFonds = unknown

export type CharlieDossier = {
  schema_version: typeof CHARLIE_DOSSIER_SCHEMA_VERSION
  dossier_id: string
  cabinet_id: string | null
  created_at: string
  updated_at: string
  bilan?: BilanSnapshot
  client_summary?: ClientSummary
  selection_fonds?: SelectionFonds
  proposition?: unknown
}

export type DossierEnvelope = {
  dossier_id: string
  data: CharlieDossier
  steps_completed: ParcoursStep[]
  created_at: string
  updated_at: string
  expires_at: string
}

export type CreateDossierResponse = {
  dossier_id: string
  access_token: string
  steps_completed: ParcoursStep[]
}

// --- Env-var resolution (Next.js) ---

function dossierApiBase(): string {
  const base = process.env.NEXT_PUBLIC_DOSSIER_API || ''
  return base.replace(/\/+$/, '')
}

export function screenerAppUrl(): string {
  return (process.env.NEXT_PUBLIC_SCREENER_URL || '').replace(/\/+$/, '')
}

// --- HTTP client ---

async function http<T>(path: string, init?: RequestInit & { signal?: AbortSignal }): Promise<T> {
  const base = dossierApiBase()
  if (!base) throw new Error('Dossier API not configured — set NEXT_PUBLIC_DOSSIER_API')
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  if (!res.ok) {
    let detail: string | undefined
    try {
      detail = (await res.json())?.error
    } catch {
      /* noop */
    }
    throw new DossierApiError(res.status, detail || `HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

export class DossierApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'DossierApiError'
  }
}

export async function createDossier(
  initial: Partial<CharlieDossier> & { steps_completed?: ParcoursStep[] } = {},
  opts: { signal?: AbortSignal } = {}
): Promise<CreateDossierResponse> {
  return http<CreateDossierResponse>('/api/dossier', {
    method: 'POST',
    body: JSON.stringify(initial),
    signal: opts.signal,
  })
}

export async function getDossier(
  id: string,
  token: string,
  opts: { signal?: AbortSignal } = {}
): Promise<DossierEnvelope> {
  const q = `?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`
  return http<DossierEnvelope>(`/api/dossier${q}`, { signal: opts.signal })
}

export async function patchDossier(
  id: string,
  token: string,
  patch: Partial<CharlieDossier> & { steps_completed?: ParcoursStep[] },
  opts: { signal?: AbortSignal } = {}
): Promise<{ dossier_id: string; steps_completed: ParcoursStep[]; updated_at: string }> {
  const q = `?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`
  return http(`/api/dossier${q}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
    signal: opts.signal,
  })
}

// --- URL helpers ---

export function readDossierParamsFromUrl(): { id: string; token: string } | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const id = params.get('dossier_id')
  const token = params.get('token')
  if (!id || !token) return null
  return { id, token }
}

export function buildDeepLink(targetUrl: string, id: string, token: string): string {
  const base = targetUrl.replace(/\/+$/, '')
  return `${base}/?dossier_id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`
}

// --- sessionStorage helpers for in-session resume only ---
// We deliberately use sessionStorage (cleared on tab close) rather than
// localStorage to limit the exposure of the access_token. The token is a
// bearer secret — leaving it persisted across browser restarts would let
// anyone with screen access to a shared CGP workstation resume a dossier
// from yesterday's client.

const DOSSIER_SS_KEY = 'charlie_dossier_ref'

export function storeDossierRef(id: string, token: string) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(DOSSIER_SS_KEY, JSON.stringify({ id, token }))
  } catch {
    /* sessionStorage may be unavailable */
  }
}

export function loadDossierRef(): { id: string; token: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(DOSSIER_SS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.id && parsed?.token) return parsed
    return null
  } catch {
    return null
  }
}

// Remove dossier params from the URL after consumption so the token doesn't
// leak via copy-paste, Referer headers, or browser history.
// Called by hydration hooks after a successful first read.
export function scrubDossierFromUrl() {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('dossier_id') && !url.searchParams.has('token')) return
    url.searchParams.delete('dossier_id')
    url.searchParams.delete('token')
    window.history.replaceState({}, '', url.toString())
  } catch {
    /* noop */
  }
}

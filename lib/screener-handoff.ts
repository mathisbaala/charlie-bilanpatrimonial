// Orchestration du handoff Bilan → Screener.
// Crée le dossier partagé, mémorise sa référence, puis redirige le navigateur
// vers le screener. Utilisé par le CTA « Continuer vers le Screener » et par la
// redirection automatique après téléchargement du PDF.

import type { BilanData, BilanCalculations, CabinetConfig } from './types'
import { bilanIsReadyForScreener, buildClientSummary } from './dossier-mapping'
import {
  buildDeepLink,
  createDossier,
  DossierApiError,
  screenerAppUrl,
  storeDossierRef,
} from './charlie-dossier'

type HandoffArgs = {
  bilan: BilanData
  calculations: BilanCalculations
  cabinet: CabinetConfig
  montant: number
}

// Ne résout jamais : en cas de succès, la page navigue vers le screener.
// Lève une erreur lisible si le bilan est incomplet, l'URL non configurée,
// ou si l'API dossier échoue.
export async function goToScreener({ bilan, calculations, cabinet, montant }: HandoffArgs): Promise<never> {
  const readiness = bilanIsReadyForScreener(bilan)
  if (!readiness.ready) {
    throw new Error(`Complétez d'abord : ${readiness.missing.join(', ')}.`)
  }

  const target = screenerAppUrl()
  if (!target) {
    throw new Error('URL du screener non configurée (NEXT_PUBLIC_SCREENER_URL).')
  }

  const summary = buildClientSummary(bilan, calculations, montant)
  const created = await createDossier({
    bilan: { bilanData: bilan, calculations },
    client_summary: summary,
    cabinet,
    steps_completed: ['bilan'],
  })
  storeDossierRef(created.dossier_id, created.access_token)
  window.location.href = buildDeepLink(target, created.dossier_id, created.access_token)

  return new Promise<never>(() => {})
}

export function formatHandoffError(err: unknown): string {
  if (err instanceof DossierApiError) return `Erreur API (${err.status}) : ${err.message}`
  if (err instanceof Error) return err.message
  return 'Erreur inconnue'
}

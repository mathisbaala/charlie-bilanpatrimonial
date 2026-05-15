'use client'

import { useState } from 'react'
import { useBilan } from '@/context/BilanContext'
import { bilanIsReadyForScreener, buildClientSummary } from '@/lib/dossier-mapping'
import {
  buildDeepLink,
  createDossier,
  DossierApiError,
  screenerAppUrl,
  storeDossierRef,
} from '@/lib/charlie-dossier'

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

export function ContinueToScreenerButton() {
  const { bilan, calculations } = useBilan()
  const [open, setOpen] = useState(false)
  const [montant, setMontant] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readiness = bilanIsReadyForScreener(bilan)
  const suggestedAmount = Math.round(Math.max(0, (calculations.totalActifFinancier || 0) * 0.2))

  function openModal() {
    setMontant(montant || suggestedAmount)
    setError(null)
    setOpen(true)
  }

  async function handleSubmit() {
    if (!readiness.ready) {
      setError(`Complétez d'abord : ${readiness.missing.join(', ')}.`)
      return
    }
    const target = screenerAppUrl()
    if (!target) {
      setError('URL du screener non configurée (NEXT_PUBLIC_SCREENER_URL).')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const summary = buildClientSummary(bilan, calculations, montant)
      const created = await createDossier({
        bilan: { bilanData: bilan, calculations },
        client_summary: summary,
        steps_completed: ['bilan'],
      })
      storeDossierRef(created.dossier_id, created.access_token)
      window.location.href = buildDeepLink(target, created.dossier_id, created.access_token)
    } catch (err) {
      const message =
        err instanceof DossierApiError
          ? `Erreur API (${err.status}) : ${err.message}`
          : err instanceof Error
          ? err.message
          : 'Erreur inconnue'
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
      >
        Continuer vers le Screener
        <span aria-hidden>→</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-xl text-ink-950 mb-1">Vers le screener</h2>
            <p className="text-sm text-ink-500 mb-4">
              Un dossier va être créé et transmis au screener. Indiquez le montant à investir
              pour calibrer la sélection.
            </p>

            <label className="block mb-4">
              <span className="text-xs uppercase tracking-wide text-ink-500">Montant à investir</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={montant}
                onChange={(e) => setMontant(Number(e.target.value) || 0)}
                className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-ink-950"
                disabled={submitting}
              />
              <span className="block mt-1 text-xs text-ink-400">
                Suggestion : {formatCurrency(suggestedAmount)} (≈ 20 % de l&apos;actif financier)
              </span>
            </label>

            <div className="rounded-lg bg-surface-1 border border-ink-100 p-3 text-xs text-ink-600 space-y-1">
              <div>Profil de risque : <strong>{bilan.profilRisque.resultat || '—'}</strong></div>
              <div>Horizon : <strong>{bilan.profilRisque.horizon || '—'}</strong></div>
              <div>Capacité d&apos;épargne : <strong>{formatCurrency(Math.max(0, calculations.capaciteEpargneMensuelle))} / mois</strong></div>
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="px-3 py-2 text-sm text-ink-600 hover:text-ink-900"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !readiness.ready || montant <= 0}
                className="px-4 py-2 rounded-lg bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 disabled:opacity-50"
              >
                {submitting ? 'Création…' : 'Créer le dossier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useBilan } from '@/context/BilanContext'
import { bilanIsReadyForScreener } from '@/lib/dossier-mapping'
import { goToScreener, formatHandoffError } from '@/lib/screener-handoff'

export function ContinueToScreenerButton() {
  const { bilan, calculations } = useBilan()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readiness = bilanIsReadyForScreener(bilan)
  const suggestedAmount = Math.round(Math.max(0, (calculations.totalActifFinancier || 0) * 0.2))

  async function handleClick() {
    setSubmitting(true)
    setError(null)
    try {
      await goToScreener({ bilan, calculations, montant: suggestedAmount })
    } catch (err) {
      setError(formatHandoffError(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting || !readiness.ready}
        className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 text-white text-sm font-semibold shadow-sm hover:bg-gold-600 hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm"
      >
        {submitting ? 'Préparation du screener…' : 'Continuer vers le Screener'}
        <ArrowRight
          size={16}
          aria-hidden
          className="transition-transform group-hover:translate-x-0.5"
        />
      </button>
      {error && (
        <p className="text-xs text-neg-600 bg-neg-50 border border-neg-100 rounded-lg px-3 py-1.5 max-w-xs text-right">
          {error}
        </p>
      )}
    </div>
  )
}

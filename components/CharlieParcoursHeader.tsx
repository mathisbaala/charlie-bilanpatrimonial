'use client'

import { useEffect, useState } from 'react'
import { getDossier, loadDossierRef, readDossierParamsFromUrl } from '@/lib/charlie-dossier'
import type { ClientSummary, ParcoursStep } from '@/lib/charlie-dossier'

// ─── Bandeau de parcours — composant partagé (voir DESIGN.md) ──────────────
// Rendu strictement identique dans les 3 apps. Seuls diffèrent : la source de
// données, le positionnement du wrapper, et l'étape courante.

type Step = { id: ParcoursStep; label: string; index: number }

const STEPS: Step[] = [
  { id: 'bilan', label: 'Bilan', index: 1 },
  { id: 'screener', label: 'Screener', index: 2 },
  { id: 'proposition', label: 'Proposition', index: 3 },
]

const CURRENT_STEP: ParcoursStep = 'bilan'

// Masque le bandeau au scroll vers le bas, le ré-affiche au scroll vers le haut.
function useAutoHide() {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let lastY = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y < 24) setHidden(false)
      else if (y > lastY + 6) setHidden(true)
      else if (y < lastY - 6) setHidden(false)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return hidden
}

export function CharlieParcoursHeader() {
  const [dossierRef, setDossierRef] = useState<{ id: string; token: string } | null>(null)
  const [summary, setSummary] = useState<ClientSummary | null>(null)
  const [stepsCompleted, setStepsCompleted] = useState<ParcoursStep[]>([])
  const hidden = useAutoHide()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDossierRef(readDossierParamsFromUrl() ?? loadDossierRef())
  }, [])

  useEffect(() => {
    if (!dossierRef) return
    const controller = new AbortController()
    void getDossier(dossierRef.id, dossierRef.token, { signal: controller.signal })
      .then((env) => {
        if (controller.signal.aborted) return
        if (env.data.client_summary) setSummary(env.data.client_summary)
        setStepsCompleted(env.steps_completed || [])
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        console.warn('[dossier] header hydration failed', err)
      })
    return () => controller.abort()
  }, [dossierRef])

  if (!dossierRef) return null

  return (
    <>
      {/* Réserve la hauteur du bandeau fixe dans le flux. */}
      <div aria-hidden className="h-11" />
      {/* left-64 dégage la Sidebar fixe de 16rem. */}
      <div
        className={`fixed top-0 left-64 right-0 z-30 transition-transform duration-300 ease-out ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="h-11 bg-[#FAF6EF]/85 backdrop-blur-md border-b border-[#E8DDD0]/70 shadow-[0_8px_24px_-16px_rgba(26,20,16,0.35)]">
          <div className="h-full px-6 flex items-center justify-between gap-3 text-xs">
            <ParcoursIdentite summary={summary} />
            <ParcoursSteps stepsCompleted={stepsCompleted} />
          </div>
        </div>
      </div>
    </>
  )
}

// ── Rendu partagé — identique dans les 3 apps ──────────────────────────────

export function ParcoursIdentite({ summary }: { summary: ClientSummary | null }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/charlie-favicon.png" alt="Charlie" className="h-[18px] w-[18px] object-contain" />
      {summary && (
        <span className="text-[#7A6B5E]">
          Dossier de <span className="font-medium text-[#1A1410]">{summary.nomComplet}</span>
        </span>
      )}
    </div>
  )
}

export function ParcoursSteps({ stepsCompleted }: { stepsCompleted: ParcoursStep[] }) {
  return (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((s) => {
        const done = stepsCompleted.includes(s.id)
        const active = s.id === CURRENT_STEP
        return (
          <li
            key={s.id}
            className={[
              'flex items-center gap-1 px-2.5 py-1 rounded-full border',
              active
                ? 'border-[#1A1410] text-[#1A1410] bg-white'
                : done
                ? 'border-[#BBD0C5] text-[#1F4535] bg-[#E8F0EC]'
                : 'border-[#E8DDD0] text-[#9A8B7C] bg-white',
            ].join(' ')}
          >
            <span className="font-semibold">{s.index}</span>
            <span>{s.label}</span>
            {done && !active && <span aria-hidden>✓</span>}
          </li>
        )
      })}
    </ol>
  )
}

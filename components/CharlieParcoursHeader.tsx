'use client'

import { useEffect, useState } from 'react'
import { getDossier, loadDossierRef, readDossierParamsFromUrl } from '@/lib/charlie-dossier'
import type { ParcoursStep } from '@/lib/charlie-dossier'

type Step = { id: ParcoursStep; label: string; index: number }

const STEPS: Step[] = [
  { id: 'bilan', label: 'Bilan', index: 1 },
  { id: 'screener', label: 'Screener', index: 2 },
  { id: 'proposition', label: 'Proposition', index: 3 },
]

const CURRENT_STEP: ParcoursStep = 'bilan'

export function CharlieParcoursHeader() {
  // dossierRef stays null on the server AND on the first client render — this
  // keeps SSR and client hydration identical (both render `null`). We only
  // read the browser-only URL/sessionStorage AFTER mount, in the effect below.
  // Reading `window` in a useState initializer would desync SSR vs client and
  // throw a hydration mismatch.
  const [dossierRef, setDossierRef] = useState<{ id: string; token: string } | null>(null)
  const [clientName, setClientName] = useState<string | null>(null)
  const [stepsCompleted, setStepsCompleted] = useState<ParcoursStep[]>([])

  // Read the dossier ref once, post-mount (client-only, hydration-safe).
  // setState-in-effect is correct here: the URL is an external system we sync
  // from after hydration. Reading it during render would break SSR.
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
        const name = env.data.client_summary?.nomComplet
        if (name) setClientName(name)
        setStepsCompleted(env.steps_completed || [])
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        // Surface to the console at least — silently swallowing makes the
        // missing client name impossible to debug.
        console.warn('[dossier] header hydration failed', err)
      })
    return () => controller.abort()
  }, [dossierRef])

  if (!dossierRef) return null

  return (
    // pl-[17rem] clears the fixed 16rem (256px) Sidebar so the left content
    // (Charlie + client name) isn't hidden behind it.
    <div className="border-b border-ink-100 bg-surface-1">
      <div className="pl-[17rem] pr-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="font-serif text-sm text-ink-700">Charlie</div>
          {clientName && (
            <div className="text-xs text-ink-500">
              Dossier de <span className="font-medium text-ink-800">{clientName}</span>
            </div>
          )}
        </div>
        <ol className="flex items-center gap-3 text-xs">
          {STEPS.map((s) => {
            const done = stepsCompleted.includes(s.id)
            const active = s.id === CURRENT_STEP
            return (
              <li
                key={s.id}
                className={[
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full border',
                  active
                    ? 'border-ink-800 text-ink-950 bg-white'
                    : done
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                    : 'border-ink-100 text-ink-400 bg-white',
                ].join(' ')}
              >
                <span className="font-semibold">{s.index}</span>
                <span>{s.label}</span>
                {done && !active && <span aria-hidden>✓</span>}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

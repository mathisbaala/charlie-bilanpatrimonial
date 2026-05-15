'use client'

import { useBilan } from '@/context/BilanContext'
import { TextareaField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Target } from 'lucide-react'
import type { PrioriteObjectif, DelaiCible } from '@/lib/types'
import { ContinueToScreenerButton } from '@/components/ContinueToScreenerButton'
import { bilanIsReadyForScreener } from '@/lib/dossier-mapping'

const DELAI_OPTIONS: { value: DelaiCible | ''; label: string }[] = [
  { value: '', label: '—' },
  { value: 'moins_3ans', label: 'Moins de 3 ans' },
  { value: '3_5ans', label: '3 à 5 ans' },
  { value: '5_10ans', label: '5 à 10 ans' },
  { value: 'plus_10ans', label: 'Plus de 10 ans' },
]

const PRIORITE_OPTIONS: { value: PrioriteObjectif; label: string; color: string }[] = [
  { value: 'haute', label: 'Haute', color: '#952033' },
  { value: 'moyenne', label: 'Moyenne', color: '#A8874A' },
  { value: 'basse', label: 'Basse', color: '#8E8D87' },
]

export function ObjectifsSection() {
  const { bilan, updateObjectifs } = useBilan()
  const { objectifs } = bilan.objectifs

  const toggleObjectif = (id: string) => {
    updateObjectifs({
      objectifs: objectifs.map(o =>
        o.id === id ? { ...o, selected: !o.selected, priorite: !o.selected ? ('moyenne' as PrioriteObjectif) : '' } : o
      )
    })
  }

  const setPriorite = (id: string, priorite: PrioriteObjectif) => {
    updateObjectifs({
      objectifs: objectifs.map(o => o.id === id ? { ...o, priorite } : o)
    })
  }

  const setMontantCible = (id: string, value: string) => {
    const updated = objectifs.map(o =>
      o.id === id ? { ...o, montantCible: value === '' ? 0 : Number(value) } : o
    )
    updateObjectifs({ objectifs: updated })
  }

  const setDelaiCible = (id: string, value: DelaiCible | '') => {
    const updated = objectifs.map(o =>
      o.id === id ? { ...o, delaiCible: value } : o
    )
    updateObjectifs({ objectifs: updated })
  }

  const selectedCount = objectifs.filter(o => o.selected).length

  return (
    <div>
      <SectionHeader
        title="Objectifs patrimoniaux"
        subtitle="Sélectionnez et priorisez les objectifs du client"
        icon={<Target size={18} />}
      />

      {selectedCount > 0 && (
        <div className="mb-4 px-4 py-2.5 bg-navy-50 rounded-xl text-sm text-navy-600">
          {selectedCount} objectif{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {objectifs.map((obj) => (
          <div
            key={obj.id}
            className={`rounded-xl border transition-all duration-150 ${
              obj.selected
                ? 'border-navy-600 bg-navy-50'
                : 'border-ink-100 bg-surface-1 hover:border-ink-200 hover:bg-surface-2'
            }`}
          >
            <div className="flex items-center gap-3 p-3">
              <button
                onClick={() => toggleObjectif(obj.id)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  obj.selected ? 'border-navy-600 bg-navy-600' : 'border-ink-200'
                }`}
              >
                {obj.selected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${obj.selected ? 'text-ink-800 font-medium' : 'text-ink-600'}`}>
                {obj.libelle}
              </span>
              {obj.selected && (
                <div className="flex gap-1">
                  {PRIORITE_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPriorite(obj.id, p.value)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                        obj.priorite === p.value ? 'text-white' : 'text-ink-400 hover:text-ink-600'
                      }`}
                      style={obj.priorite === p.value ? { backgroundColor: p.color } : {}}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {obj.selected && (
              <div className="pl-8 pr-3 pb-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink-500 mb-1">Montant cible (€)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ex: 200000"
                    value={obj.montantCible === 0 ? '' : obj.montantCible}
                    onChange={(e) => setMontantCible(obj.id, e.target.value)}
                    className="w-full text-sm px-3 py-1.5 rounded-lg border border-ink-200 bg-white focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-200 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-500 mb-1">Délai cible</label>
                  <select
                    value={obj.delaiCible}
                    onChange={(e) => setDelaiCible(obj.id, e.target.value as DelaiCible | '')}
                    className="w-full text-sm px-3 py-1.5 rounded-lg border border-ink-200 bg-white focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-200 transition-colors"
                  >
                    {DELAI_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Card className="mb-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => updateObjectifs({ preferencesESG: !bilan.objectifs.preferencesESG })}
            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              bilan.objectifs.preferencesESG ? 'border-navy-600 bg-navy-600' : 'border-ink-200'
            }`}
          >
            {bilan.objectifs.preferencesESG && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <div>
            <p className="text-sm font-medium text-ink-800">
              Sensibilité ESG / Investissement responsable (ISR)
            </p>
            {bilan.objectifs.preferencesESG && (
              <p className="mt-1 text-xs text-ink-500">
                Le client souhaite que ses investissements intègrent des critères Environnementaux, Sociaux et de Gouvernance.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <TextareaField
          label="Commentaires et précisions du client"
          value={bilan.objectifs.commentaires}
          onChange={(v) => updateObjectifs({ commentaires: v })}
          placeholder="Projets spécifiques, contraintes particulières, délais envisagés..."
          rows={3}
        />
        <div className="mt-4">
          <TextareaField
            label="Recommandations du conseiller (apparaîtront dans le PDF)"
            value={bilan.objectifs.recommandations}
            onChange={(v) => updateObjectifs({ recommandations: v })}
            placeholder="Stratégies recommandées, actions prioritaires, orientations d'investissement..."
            rows={5}
          />
        </div>
      </Card>

      <NextStepCard />
    </div>
  )
}

// CTA de fin de parcours : une fois le bilan complet, le conseiller passe
// au screener pour sélectionner les fonds adaptés au profil du client.
function NextStepCard() {
  const { bilan } = useBilan()
  const readiness = bilanIsReadyForScreener(bilan)

  return (
    <div className="rounded-xl border border-navy-200 bg-navy-50/60 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-ink-900">
          Étape suivante — Sélection des fonds
        </p>
        <p className="mt-0.5 text-xs text-ink-500 max-w-md">
          {readiness.ready
            ? 'Le bilan est complet. Transmettez le profil au Screener pour construire une sélection de fonds adaptée.'
            : `Complétez d'abord : ${readiness.missing.join(', ')}.`}
        </p>
      </div>
      <div className="flex-shrink-0">
        <ContinueToScreenerButton />
      </div>
    </div>
  )
}

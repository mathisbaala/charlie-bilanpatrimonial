'use client'

import { useBilan } from '@/context/BilanContext'
import { TextareaField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Target } from 'lucide-react'
import type { PrioriteObjectif } from '@/lib/types'

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
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 ${
              obj.selected
                ? 'border-navy-600 bg-navy-50'
                : 'border-ink-100 bg-surface-1 hover:border-ink-200 hover:bg-surface-2'
            }`}
          >
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
        ))}
      </div>

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
    </div>
  )
}

'use client'

import { useBilan } from '@/context/BilanContext'
import { InputField, TextareaField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatEuros } from '@/lib/calculations'
import { Calculator, Trash2, Plus } from 'lucide-react'
import type { Heritier } from '@/lib/types'

const TMI_DESCRIPTIONS: Record<number, string> = {
  0: 'Non imposable',
  11: 'Tranche à 11 %',
  30: 'Tranche à 30 %',
  41: 'Tranche à 41 %',
  45: 'Tranche à 45 %',
}

const LIEN_LABELS: Record<Heritier['lien'], string> = {
  conjoint: 'Conjoint(e)',
  enfant: 'Enfant',
  petit_enfant: 'Petit-enfant',
  autre: 'Autre',
}

export function FiscaliteSection() {
  const { bilan, calculations, updateFiscalite } = useBilan()
  const { fiscalite } = bilan

  const heritiers: Heritier[] = fiscalite.heritiers ?? []

  function addHeritier() {
    const newHeritier: Heritier = {
      id: crypto.randomUUID(),
      lien: 'enfant',
      prenom: '',
      abattementRestant: 100000,
    }
    updateFiscalite({ heritiers: [...heritiers, newHeritier] })
  }

  function updateHeritier(id: string, patch: Partial<Heritier>) {
    updateFiscalite({
      heritiers: heritiers.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    })
  }

  function removeHeritier(id: string) {
    updateFiscalite({ heritiers: heritiers.filter((h) => h.id !== id) })
  }

  return (
    <div>
      <SectionHeader
        title="Analyse fiscale"
        subtitle="Imposition, IFI et stratégie de transmission"
        icon={<Calculator size={18} />}
      />

      {/* TMI Result */}
      <div className="mb-4 p-4 bg-navy-50 rounded-xl border border-navy-100 flex items-center justify-between">
        <div>
          <p className="text-xs text-navy-600 uppercase tracking-wide mb-1">Tranche Marginale d&apos;Imposition</p>
          <p className="text-2xl font-serif text-ink-950">{calculations.tmi} %</p>
          <p className="text-xs text-ink-600">{TMI_DESCRIPTIONS[calculations.tmi] || ''}</p>
        </div>
        {calculations.isAssujettisIFI && (
          <div className="text-right">
            <p className="text-xs text-neg-600 uppercase tracking-wide mb-1">IFI estimé</p>
            <p className="text-xl font-semibold" style={{ color: '#952033' }}>{formatEuros(calculations.estimationIFI)}</p>
            <p className="text-xs text-ink-400">Assujetti IFI</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <h3 className="text-sm font-semibold text-ink-800 mb-4">Calcul de la TMI</h3>
          <div className="grid grid-cols-2 gap-5">
            <InputField
              label="Revenu imposable"
              value={fiscalite.revenuImposable || ''}
              onChange={(v) => updateFiscalite({ revenuImposable: parseFloat(v) || 0 })}
              type="number"
              suffix="€"
              hint="Revenu net imposable avant abattements"
            />
            <InputField
              label="Nombre de parts (QF)"
              value={fiscalite.nombrePartsQF}
              onChange={(v) => updateFiscalite({ nombrePartsQF: parseFloat(v) || 1 })}
              type="number"
              step={0.5}
              min={1}
              hint="Quotient familial"
            />
          </div>
        </Card>

        {/* IFI — auto-calculated bloc */}
        <Card>
          <div className="flex items-center gap-1 mb-4">
            <h3 className="text-sm font-semibold text-ink-800">Impôt sur la Fortune Immobilière (IFI)</h3>
            <Tooltip content="Impôt sur la Fortune Immobilière. Déclenché si actif immobilier net > 1 300 000 €. Résidence principale : abattement 30 %." />
          </div>

          {/* Status badge */}
          <div className="mb-3">
            {calculations.isAssujettisIFI ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Assujetti IFI — {formatEuros(calculations.estimationIFI)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Non assujetti
              </span>
            )}
          </div>

          <p className="text-xs text-ink-500 mb-4">
            Base calculée : actif immobilier ({formatEuros(calculations.totalActifImmobilier)}) − crédits immobiliers
          </p>

          <InputField
            label="Ajuster la base IFI si nécessaire (€)"
            value={fiscalite.actifImmobilierNetIFI || ''}
            onChange={(v) => updateFiscalite({ actifImmobilierNetIFI: parseFloat(v) || 0 })}
            type="number"
            suffix="€"
            hint="Laissez vide pour utiliser la base calculée automatiquement"
          />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-ink-800 mb-4">Succession & transmission</h3>
          <TextareaField
            label="Stratégie de succession"
            value={fiscalite.strategieSuccession}
            onChange={(v) => updateFiscalite({ strategieSuccession: v })}
            placeholder="Ordre des héritiers, abattements disponibles, donations envisagées, assurance-vie comme outil de transmission..."
            rows={4}
          />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-ink-800 mb-4">Observations fiscales du conseiller</h3>
          <TextareaField
            label="Observations"
            value={fiscalite.observationsFiscales}
            onChange={(v) => updateFiscalite({ observationsFiscales: v })}
            placeholder="Optimisations possibles, risques identifiés, points de vigilance..."
            rows={4}
          />
        </Card>

        {/* Succession structurée — héritiers présomptifs */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink-800">Succession — héritiers présomptifs</h3>
            <button
              type="button"
              onClick={addHeritier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-navy text-white hover:bg-navy-700 transition-colors"
            >
              <Plus size={13} />
              Ajouter un héritier
            </button>
          </div>

          {heritiers.length === 0 ? (
            <p className="text-sm text-ink-400 italic text-center py-6">
              Aucun héritier renseigné. Cliquez sur &laquo;&nbsp;Ajouter un héritier&nbsp;&raquo; pour commencer.
            </p>
          ) : (
            <div className="space-y-3">
              {heritiers.map((h) => (
                <div
                  key={h.id}
                  className="p-4 rounded-xl border border-ink-100 bg-ink-50/40 space-y-3"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-ink-600 mb-1">Lien de parenté</label>
                      <select
                        value={h.lien}
                        onChange={(e) => updateHeritier(h.id, { lien: e.target.value as Heritier['lien'] })}
                        className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy"
                      >
                        {(Object.keys(LIEN_LABELS) as Heritier['lien'][]).map((lien) => (
                          <option key={lien} value={lien}>{LIEN_LABELS[lien]}</option>
                        ))}
                      </select>
                    </div>
                    <InputField
                      label="Prénom"
                      value={h.prenom}
                      onChange={(v) => updateHeritier(h.id, { prenom: v })}
                      placeholder="Prénom"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <InputField
                      label="Abattement restant"
                      value={h.abattementRestant || ''}
                      onChange={(v) => updateHeritier(h.id, { abattementRestant: parseFloat(v) || 0 })}
                      type="number"
                      suffix="€"
                      hint="100 000 € pour un enfant, 31 865 € pour un petit-enfant"
                    />
                    <div>
                      <p className="text-xs text-ink-500 mb-1">Droits estimés</p>
                      {h.lien === 'conjoint' ? (
                        <p className="text-sm font-medium text-green-700">Exonéré de droits de succession</p>
                      ) : (
                        <p className="text-sm text-ink-600 italic">Voir total ci-dessous</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeHeritier(h.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neg-600 hover:bg-neg-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={12} />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}

              {calculations.droitsSuccessionEstimes > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink-800">Droits de succession estimés (total)</span>
                    <span className="text-base font-bold text-amber-800">{formatEuros(calculations.droitsSuccessionEstimes)}</span>
                  </div>
                  <p className="text-xs text-ink-500 italic">
                    Estimation indicative — ne se substitue pas au calcul notarial
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

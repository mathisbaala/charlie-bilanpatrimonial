'use client'

import { useBilan } from '@/context/BilanContext'
import { InputField, TextareaField, ToggleField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatEuros } from '@/lib/calculations'
import { Calculator } from 'lucide-react'

const TMI_DESCRIPTIONS: Record<number, string> = {
  0: 'Non imposable',
  11: 'Tranche à 11 %',
  30: 'Tranche à 30 %',
  41: 'Tranche à 41 %',
  45: 'Tranche à 45 %',
}

export function FiscaliteSection() {
  const { bilan, calculations, updateFiscalite } = useBilan()
  const { fiscalite } = bilan

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

        <Card>
          <h3 className="text-sm font-semibold text-ink-800 mb-4">Impôt sur la Fortune Immobilière (IFI)</h3>
          <ToggleField
            label="Assujetti à l'IFI"
            hint="Actif immobilier net supérieur à 1 300 000 €"
            checked={fiscalite.hasIFI}
            onChange={(v) => updateFiscalite({ hasIFI: v })}
          />
          {fiscalite.hasIFI && (
            <div className="mt-4">
              <InputField
                label="Actif immobilier net IFI"
                value={fiscalite.actifImmobilierNetIFI || ''}
                onChange={(v) => updateFiscalite({ actifImmobilierNetIFI: parseFloat(v) || 0 })}
                type="number"
                suffix="€"
                hint="Valeur nette des biens immobiliers imposables (déduction des dettes)"
              />
            </div>
          )}
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
      </div>
    </div>
  )
}

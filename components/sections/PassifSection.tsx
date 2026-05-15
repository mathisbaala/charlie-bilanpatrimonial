'use client'

import { useState } from 'react'
import { useBilan } from '@/context/BilanContext'
import { InputField, SelectField, TextareaField, ToggleField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatEuros } from '@/lib/calculations'
import type { Credit } from '@/lib/types'
import { CreditCard, Plus, Trash2 } from 'lucide-react'

const TYPE_CREDIT_OPTIONS = [
  { value: 'immobilier', label: 'Crédit immobilier' },
  { value: 'consommation', label: 'Crédit consommation' },
  { value: 'professionnel', label: 'Crédit professionnel' },
  { value: 'autre', label: 'Autre crédit' },
]

const TYPE_TAUX_OPTIONS = [
  { value: '', label: '—' },
  { value: 'fixe', label: 'Fixe' },
  { value: 'variable', label: 'Variable' },
  { value: 'mixte', label: 'Mixte' },
]

const GARANTIE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'hypotheque', label: 'Hypothèque' },
  { value: 'caution', label: 'Caution' },
  { value: 'ppd', label: 'PPD' },
  { value: 'autre', label: 'Autre' },
]

const COUVERTURE_ADE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'dc_ptia', label: 'DC / PTIA' },
  { value: 'dc_ptia_itt', label: 'DC / PTIA / ITT' },
  { value: 'tous_risques', label: 'Tous risques' },
]

function createCredit(): Credit {
  return {
    id: crypto.randomUUID(),
    type: 'immobilier',
    libelle: '',
    etablissement: '',
    capitalRestantDu: 0,
    tauxInteret: 0,
    typeTaux: '',
    garantie: '',
    mensualite: 0,
    dateEcheance: '',
    hasAssuranceEmprunteur: true,
    tauxADE: 0,
    couvertureADE: '',
  }
}

export function PassifSection() {
  const { bilan, updatePassif } = useBilan()
  const { passif } = bilan
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const addCredit = () => {
    const c = createCredit()
    updatePassif({ credits: [...passif.credits, c] })
    setExpandedId(c.id)
  }
  const removeCredit = (id: string) => updatePassif({ credits: passif.credits.filter(c => c.id !== id) })
  const updateCredit = (id: string, patch: Partial<Credit>) =>
    updatePassif({ credits: passif.credits.map(c => c.id === id ? { ...c, ...patch } : c) })

  const totalPassif = passif.credits.reduce((s, c) => s + (c.capitalRestantDu || 0), 0) + (passif.autresDettes || 0)

  return (
    <div>
      <SectionHeader
        title="Passif patrimonial"
        subtitle="Crédits et dettes en cours"
        icon={<CreditCard size={18} />}
      />

      {totalPassif > 0 && (
        <div className="mb-4 px-4 py-3 bg-neg-50 rounded-xl border border-neg-100 flex justify-between items-center">
          <span className="text-sm text-neg-600 font-medium">Total passif</span>
          <span className="text-lg font-semibold" style={{ color: '#B91C1C' }}>{formatEuros(totalPassif)}</span>
        </div>
      )}

      <div className="space-y-3">
        {passif.credits.map((credit) => (
          <Card key={credit.id} padding="sm">
            <div className="flex items-start justify-between mb-3">
              <button onClick={() => setExpandedId(expandedId === credit.id ? null : credit.id)} className="flex-1 text-left">
                <p className="font-medium text-ink-800 text-sm">{credit.libelle || TYPE_CREDIT_OPTIONS.find(o => o.value === credit.type)?.label || 'Nouveau crédit'}</p>
                <p className="text-xs text-ink-400">
                  {credit.etablissement || '—'} · Capital restant : {formatEuros(credit.capitalRestantDu)} · {credit.mensualite > 0 ? `${formatEuros(credit.mensualite)}/mois` : ''}
                </p>
              </button>
              <button onClick={() => removeCredit(credit.id)} className="ml-2 p-1.5 text-ink-400 hover:text-neg-600 hover:bg-neg-50 rounded transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
            {expandedId === credit.id && (
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-ink-100">
                <SelectField label="Type de crédit" value={credit.type} onChange={(v) => updateCredit(credit.id, { type: v as Credit['type'] })} options={TYPE_CREDIT_OPTIONS} />
                <InputField label="Libellé" value={credit.libelle} onChange={(v) => updateCredit(credit.id, { libelle: v })} placeholder="Crédit résidence principale" />
                <InputField label="Établissement" value={credit.etablissement} onChange={(v) => updateCredit(credit.id, { etablissement: v })} placeholder="BNP Paribas" />
                <InputField label="Capital restant dû" value={credit.capitalRestantDu || ''} onChange={(v) => updateCredit(credit.id, { capitalRestantDu: parseFloat(v) || 0 })} type="number" suffix="€" />
                <InputField label="Taux d'intérêt" value={credit.tauxInteret || ''} onChange={(v) => updateCredit(credit.id, { tauxInteret: parseFloat(v) || 0 })} type="number" suffix="%" />
                <SelectField label="Type de taux" value={credit.typeTaux} onChange={(v) => updateCredit(credit.id, { typeTaux: v as Credit['typeTaux'] })} options={TYPE_TAUX_OPTIONS} />
                <SelectField label="Garantie" value={credit.garantie} onChange={(v) => updateCredit(credit.id, { garantie: v as Credit['garantie'] })} options={GARANTIE_OPTIONS} />
                <InputField label="Mensualité" value={credit.mensualite || ''} onChange={(v) => updateCredit(credit.id, { mensualite: parseFloat(v) || 0 })} type="number" suffix="€/mois" />
                <InputField label="Date d'échéance" value={credit.dateEcheance} onChange={(v) => updateCredit(credit.id, { dateEcheance: v })} type="date" />
                <div className="flex items-center pt-3">
                  <ToggleField
                    label="Assurance emprunteur"
                    checked={credit.hasAssuranceEmprunteur}
                    onChange={(v) => updateCredit(credit.id, { hasAssuranceEmprunteur: v })}
                  />
                </div>
                {credit.hasAssuranceEmprunteur && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <span className="flex items-center text-xs font-medium text-ink-600 uppercase tracking-wide">
                        Taux ADE
                        <Tooltip content="Assurance Décès Emprunteur. Prend en charge le remboursement du crédit en cas de décès, PTIA ou ITT selon la couverture." />
                      </span>
                      <InputField
                        label=""
                        value={credit.tauxADE || ''}
                        onChange={(v) => updateCredit(credit.id, { tauxADE: parseFloat(v) || 0 })}
                        type="number"
                        suffix="%"
                      />
                    </div>
                    <SelectField
                      label="Couverture ADE"
                      value={credit.couvertureADE}
                      onChange={(v) => updateCredit(credit.id, { couvertureADE: v as Credit['couvertureADE'] })}
                      options={COUVERTURE_ADE_OPTIONS}
                    />
                  </>
                )}
              </div>
            )}
          </Card>
        ))}
        <button onClick={addCredit} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-ink-200 text-ink-600 hover:border-navy-600 hover:text-navy-600 transition-colors text-sm">
          <Plus size={16} /> Ajouter un crédit
        </button>
      </div>

      <Card className="mt-4">
        <div className="grid grid-cols-2 gap-6">
          <InputField
            label="Autres dettes / engagements"
            value={passif.autresDettes || ''}
            onChange={(v) => updatePassif({ autresDettes: parseFloat(v) || 0 })}
            type="number"
            suffix="€"
            hint="Dettes diverses non listées ci-dessus"
          />
        </div>
        <div className="mt-4">
          <TextareaField
            label="Observations"
            value={passif.commentaires}
            onChange={(v) => updatePassif({ commentaires: v })}
            placeholder="Précisions sur les crédits, garanties, cautions..."
            rows={2}
          />
        </div>
      </Card>
    </div>
  )
}

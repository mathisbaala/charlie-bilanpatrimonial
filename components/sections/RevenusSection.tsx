'use client'

import { useBilan } from '@/context/BilanContext'
import { InputField, SelectField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatEuros } from '@/lib/calculations'
import { TrendingUp, Users } from 'lucide-react'

export function RevenusSection() {
  const { bilan, calculations, updateRevenusCharges } = useBilan()
  const { revenus, charges } = bilan.revenusCharges
  const conjoint = bilan.situationFamiliale.conjoint

  const updateRev = (patch: Partial<typeof revenus>) =>
    updateRevenusCharges({ revenus: { ...revenus, ...patch } })
  const updateChg = (patch: Partial<typeof charges>) =>
    updateRevenusCharges({ charges: { ...charges, ...patch } })

  return (
    <div>
      <SectionHeader
        title="Revenus & Charges"
        subtitle="Analyse des flux financiers annuels du foyer"
        icon={<TrendingUp size={18} />}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E8E4DC' }}>
          <p className="text-xs text-ink-500 uppercase tracking-wide mb-2">Revenus mensuels</p>
          <p className="font-serif text-xl text-ink-900">{formatEuros(calculations.revenusMensuelsTotaux)}</p>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E8E4DC' }}>
          <p className="text-xs text-ink-500 uppercase tracking-wide mb-2">Charges mensuelles</p>
          <p className="font-serif text-xl text-ink-900">{formatEuros(calculations.chargesMensuellesTotales)}</p>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: '1px solid #E8E4DC' }}>
          <p className="text-xs text-ink-500 uppercase tracking-wide mb-2">Capacité d&apos;épargne</p>
          <p className="font-serif text-xl" style={{ color: calculations.capaciteEpargneMensuelle >= 0 ? '#1E7A4F' : '#952033' }}>
            {formatEuros(calculations.capaciteEpargneMensuelle)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pos-600 inline-block" />
            Revenus annuels
          </h3>
          <div className="space-y-4">
            <InputField label="Salaires nets" value={revenus.salaireNet || ''} onChange={(v) => updateRev({ salaireNet: parseFloat(v) || 0 })} type="number" suffix="€/an" />
            <InputField label="BIC / BNC (TNS, libéraux)" value={revenus.bicBnc || ''} onChange={(v) => updateRev({ bicBnc: parseFloat(v) || 0 })} type="number" suffix="€/an" />
            <InputField label="Revenus fonciers" value={revenus.revenusFonciers || ''} onChange={(v) => updateRev({ revenusFonciers: parseFloat(v) || 0 })} type="number" suffix="€/an" />

            {/* Régime foncier — visible uniquement si revenus fonciers > 0 */}
            {revenus.revenusFonciers > 0 && (
              <div className="pl-3 border-l-2 border-ink-100 space-y-4">
                <div>
                  <div className="flex items-center gap-1 mb-1.5">
                    <span className="text-xs font-medium text-ink-600 uppercase tracking-wide">Régime foncier</span>
                    <Tooltip content="Abattement forfaitaire de 30 % sur les loyers bruts. Plafonné à 15 000 €/an de revenus fonciers." />
                  </div>
                  <SelectField
                    label=""
                    value={revenus.regimeFoncier}
                    onChange={(v) => updateRev({ regimeFoncier: v as 'micro' | 'reel' | '' })}
                    options={[
                      { value: 'micro', label: 'Micro-foncier' },
                      { value: 'reel', label: 'Réel' },
                    ]}
                    placeholder="—"
                    className="-mt-1.5"
                  />
                </div>
                {revenus.regimeFoncier === 'reel' && (
                  <InputField
                    label="Charges déductibles foncières"
                    value={revenus.chargesFoncieresDed || ''}
                    onChange={(v) => updateRev({ chargesFoncieresDed: parseFloat(v) || 0 })}
                    type="number"
                    suffix="€/an"
                  />
                )}
              </div>
            )}

            <InputField label="Dividendes" value={revenus.dividendes || ''} onChange={(v) => updateRev({ dividendes: parseFloat(v) || 0 })} type="number" suffix="€/an" />
            <InputField label="Plus-values" value={revenus.plusValues || ''} onChange={(v) => updateRev({ plusValues: parseFloat(v) || 0 })} type="number" suffix="€/an" />
            <InputField label="Pensions / retraites" value={revenus.pensions || ''} onChange={(v) => updateRev({ pensions: parseFloat(v) || 0 })} type="number" suffix="€/an" />
            <InputField label="Autres revenus" value={revenus.autresRevenus || ''} onChange={(v) => updateRev({ autresRevenus: parseFloat(v) || 0 })} type="number" suffix="€/an" />

            {/* Avantages en nature — toujours visible */}
            <InputField
              label="Avantages en nature"
              value={revenus.avantagesNature || ''}
              onChange={(v) => updateRev({ avantagesNature: parseFloat(v) || 0 })}
              type="number"
              suffix="€/an"
              placeholder="Véhicule, logement de fonction..."
            />

            <div className="pt-3 border-t border-ink-100 flex justify-between">
              <span className="text-sm text-ink-600">Total annuel</span>
              <span className="text-sm font-semibold" style={{ color: '#1E7A4F' }}>
                {formatEuros(calculations.revenusMensuelsTotaux * 12)}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neg-600 inline-block" />
            Charges annuelles
          </h3>
          <div className="space-y-4">
            <InputField label="Remboursements crédits" value={charges.remboursementsCredit || ''} onChange={(v) => updateChg({ remboursementsCredit: parseFloat(v) || 0 })} type="number" suffix="€/an" hint="Total annuel des mensualités" />
            <InputField label="Charges de copropriété" value={charges.chargesCopropriete || ''} onChange={(v) => updateChg({ chargesCopropriete: parseFloat(v) || 0 })} type="number" suffix="€/an" />
            <InputField label="Pension alimentaire" value={charges.pensionAlimentaire || ''} onChange={(v) => updateChg({ pensionAlimentaire: parseFloat(v) || 0 })} type="number" suffix="€/an" />
            <InputField label="Autres charges fixes" value={charges.autresCharges || ''} onChange={(v) => updateChg({ autresCharges: parseFloat(v) || 0 })} type="number" suffix="€/an" />
            <div className="pt-3 border-t border-ink-100 flex justify-between">
              <span className="text-sm text-ink-600">Total annuel</span>
              <span className="text-sm font-semibold" style={{ color: '#952033' }}>
                {formatEuros(calculations.chargesMensuellesTotales * 12)}
              </span>
            </div>
          </div>
          {calculations.tauxEndettement > 0 && (
            <div className="mt-4 p-3 bg-surface-2 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Taux d&apos;endettement</span>
                <span className={`font-medium ${calculations.tauxEndettement > 35 ? 'text-neg-600' : 'text-pos-600'}`}>
                  {calculations.tauxEndettement.toFixed(1)} %
                  {calculations.tauxEndettement > 35 && <span className="ml-1 text-xs">(⚠ &gt; 35 %)</span>}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Revenus du conjoint — visible uniquement si conjoint renseigné */}
      {conjoint !== null && (
        <Card className="mt-4">
          <h3 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
            <Users size={14} className="text-ink-400" />
            Revenus du conjoint — {conjoint.prenom || 'Conjoint'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Salaire net"
              value={revenus.salaireNetConjoint || ''}
              onChange={(v) => updateRev({ salaireNetConjoint: parseFloat(v) || 0 })}
              type="number"
              suffix="€/an"
            />
            <InputField
              label="Autres revenus"
              value={revenus.autresRevenusConjoint || ''}
              onChange={(v) => updateRev({ autresRevenusConjoint: parseFloat(v) || 0 })}
              type="number"
              suffix="€/an"
            />
          </div>
        </Card>
      )}
    </div>
  )
}

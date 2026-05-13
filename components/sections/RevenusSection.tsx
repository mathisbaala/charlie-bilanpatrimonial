'use client'

import { useBilan } from '@/context/BilanContext'
import { InputField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatEuros } from '@/lib/calculations'
import { TrendingUp } from 'lucide-react'

export function RevenusSection() {
  const { bilan, calculations, updateRevenusCharges } = useBilan()
  const { revenus, charges } = bilan.revenusCharges

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
        <div className="bg-pos-50 rounded-xl p-4 border" style={{ borderColor: '#BBE5D0' }}>
          <p className="text-xs text-pos-600 uppercase tracking-wide mb-1">Revenus mensuels</p>
          <p className="text-xl font-semibold" style={{ color: '#1E7A4F' }}>{formatEuros(calculations.revenusMensuelsTotaux)}</p>
        </div>
        <div className="bg-neg-50 rounded-xl p-4 border" style={{ borderColor: '#F2C4CB' }}>
          <p className="text-xs text-neg-600 uppercase tracking-wide mb-1">Charges mensuelles</p>
          <p className="text-xl font-semibold" style={{ color: '#952033' }}>{formatEuros(calculations.chargesMensuellesTotales)}</p>
        </div>
        <div className="bg-surface-2 rounded-xl p-4 border border-ink-100">
          <p className="text-xs text-ink-600 uppercase tracking-wide mb-1">Capacité d&apos;épargne</p>
          <p className="text-xl font-semibold" style={{ color: calculations.capaciteEpargneMensuelle >= 0 ? '#1E7A4F' : '#952033' }}>
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
            <InputField label="Dividendes" value={revenus.dividendes || ''} onChange={(v) => updateRev({ dividendes: parseFloat(v) || 0 })} type="number" suffix="€/an" />
            <InputField label="Plus-values" value={revenus.plusValues || ''} onChange={(v) => updateRev({ plusValues: parseFloat(v) || 0 })} type="number" suffix="€/an" />
            <InputField label="Pensions / retraites" value={revenus.pensions || ''} onChange={(v) => updateRev({ pensions: parseFloat(v) || 0 })} type="number" suffix="€/an" />
            <InputField label="Autres revenus" value={revenus.autresRevenus || ''} onChange={(v) => updateRev({ autresRevenus: parseFloat(v) || 0 })} type="number" suffix="€/an" />
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
    </div>
  )
}

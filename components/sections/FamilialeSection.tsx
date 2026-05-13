'use client'

import { useBilan } from '@/context/BilanContext'
import { SelectField, TextareaField, ToggleField, NumberStepper } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Users, Plus, X } from 'lucide-react'
import type { Enfant, StatutMarital, RegimeMatrimonial } from '@/lib/types'

const STATUT_MARITAL_OPTIONS = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'marie', label: 'Marié(e)' },
  { value: 'pacse', label: 'Pacsé(e)' },
  { value: 'concubinage', label: 'En concubinage' },
  { value: 'divorce', label: 'Divorcé(e)' },
  { value: 'veuf', label: 'Veuf / Veuve' },
]

const REGIME_MATRIMONIAL_OPTIONS = [
  { value: 'communaute_legale', label: 'Communauté légale (réduite aux acquêts)' },
  { value: 'separation_biens', label: 'Séparation de biens' },
  { value: 'communaute_universelle', label: 'Communauté universelle' },
  { value: 'participation_acquets', label: 'Participation aux acquêts' },
]

export function FamilialeSection() {
  const { bilan, updateFamiliale } = useBilan()
  const { situationFamiliale } = bilan

  const showRegimeMatrimonial = ['marie', 'pacse'].includes(situationFamiliale.statutMarital)

  const addEnfant = () => {
    const newEnfant: Enfant = { id: crypto.randomUUID(), age: 0, aCharge: true }
    updateFamiliale({ enfants: [...situationFamiliale.enfants, newEnfant] })
  }

  const removeEnfant = (id: string) => {
    updateFamiliale({ enfants: situationFamiliale.enfants.filter(e => e.id !== id) })
  }

  const updateEnfant = (id: string, patch: Partial<Enfant>) => {
    updateFamiliale({
      enfants: situationFamiliale.enfants.map(e => e.id === id ? { ...e, ...patch } : e)
    })
  }

  const setNombreEnfants = (n: number) => {
    updateFamiliale({ nombreEnfants: n })
  }

  return (
    <div>
      <SectionHeader
        title="Situation familiale & matrimoniale"
        subtitle="Composition du foyer et régime matrimonial"
        icon={<Users size={18} />}
      />

      <div className="space-y-4">
        <Card>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <SelectField
              label="Statut marital"
              value={situationFamiliale.statutMarital}
              onChange={(v) => updateFamiliale({ statutMarital: v as StatutMarital })}
              options={STATUT_MARITAL_OPTIONS}
              required
            />
            {showRegimeMatrimonial && (
              <SelectField
                label="Régime matrimonial"
                value={situationFamiliale.regimeMatrimonial}
                onChange={(v) => updateFamiliale({ regimeMatrimonial: v as RegimeMatrimonial })}
                options={REGIME_MATRIMONIAL_OPTIONS}
              />
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-ink-800 mb-4">Enfants</h3>
          <NumberStepper
            label="Nombre d'enfants"
            value={situationFamiliale.nombreEnfants}
            onChange={setNombreEnfants}
            max={15}
          />

          {situationFamiliale.enfants.length > 0 && (
            <div className="mt-4 space-y-2">
              {situationFamiliale.enfants.map((enfant, i) => (
                <div key={enfant.id} className="flex items-center gap-3 p-3 bg-surface-2 rounded-lg">
                  <span className="text-xs text-ink-400 w-12">Enfant {i + 1}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs text-ink-600 whitespace-nowrap">Âge :</label>
                    <input
                      type="number"
                      value={enfant.age}
                      onChange={(e) => updateEnfant(enfant.id, { age: parseInt(e.target.value) || 0 })}
                      className="w-16 h-8 rounded border border-ink-100 bg-surface-1 text-ink-800 text-sm px-2 focus:outline-none focus:border-navy-600"
                      min={0}
                      max={50}
                    />
                    <span className="text-xs text-ink-400">ans</span>
                  </div>
                  <ToggleField
                    label="À charge"
                    checked={enfant.aCharge}
                    onChange={(v) => updateEnfant(enfant.id, { aCharge: v })}
                    className="flex-1"
                  />
                  <button
                    onClick={() => removeEnfant(enfant.id)}
                    className="w-6 h-6 rounded flex items-center justify-center text-ink-400 hover:text-neg-600 hover:bg-neg-50 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addEnfant}
            className="mt-3 flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-800 transition-colors"
          >
            <Plus size={14} />
            Ajouter un enfant
          </button>
        </Card>

        <Card>
          <h3 className="text-sm font-medium text-ink-800 mb-4">Documents & dispositions</h3>
          <div className="space-y-3">
            <ToggleField
              label="Testament existant"
              hint="Le client a rédigé un testament"
              checked={situationFamiliale.hasTestament}
              onChange={(v) => updateFamiliale({ hasTestament: v })}
            />
            <ToggleField
              label="Donations existantes"
              hint="Des donations ont déjà été réalisées"
              checked={situationFamiliale.hasDonation}
              onChange={(v) => updateFamiliale({ hasDonation: v })}
            />
          </div>
          <div className="mt-4">
            <TextareaField
              label="Observations"
              value={situationFamiliale.commentairesFamiliaux}
              onChange={(v) => updateFamiliale({ commentairesFamiliaux: v })}
              placeholder="Précisions sur la situation familiale, héritiers, donations..."
              rows={3}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

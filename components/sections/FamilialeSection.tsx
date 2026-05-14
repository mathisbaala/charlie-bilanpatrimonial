'use client'

import { useBilan } from '@/context/BilanContext'
import { InputField, SelectField, TextareaField, ToggleField, NumberStepper } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Users, Plus, X } from 'lucide-react'
import type { Enfant, StatutMarital, RegimeMatrimonial, SituationProfessionnelle, Donation } from '@/lib/types'

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

const SITUATION_PROFESSIONNELLE_OPTIONS = [
  { value: 'salarie', label: 'Salarié(e)' },
  { value: 'tns', label: 'TNS' },
  { value: 'dirigeant', label: 'Dirigeant(e)' },
  { value: 'retraite', label: 'Retraité(e)' },
  { value: 'sans_emploi', label: 'Sans emploi' },
  { value: 'autre', label: 'Autre' },
]

const LIEN_PARENTE_OPTIONS = [
  { value: 'biologique', label: 'Biologique' },
  { value: 'adopte', label: 'Adopté(e)' },
  { value: 'recompose', label: 'Recomposé(e)' },
]

const TYPE_TESTAMENT_OPTIONS = [
  { value: 'olographe', label: 'Olographe (manuscrit)' },
  { value: 'authentique', label: 'Authentique (notarié)' },
]

const TYPE_DONATION_OPTIONS = [
  { value: 'manuel', label: 'Don manuel' },
  { value: 'assurance_vie', label: 'Assurance-vie' },
  { value: 'demembrement', label: 'Démembrement' },
  { value: 'autre', label: 'Autre' },
]

export function FamilialeSection() {
  const { bilan, updateFamiliale } = useBilan()
  const { situationFamiliale } = bilan

  const showRegimeMatrimonial = ['marie', 'pacse'].includes(situationFamiliale.statutMarital)
  const showDateUnion = ['marie', 'pacse'].includes(situationFamiliale.statutMarital)
  const showConjoint = ['marie', 'pacse', 'concubinage'].includes(situationFamiliale.statutMarital)

  // --- Enfants ---
  const addEnfant = () => {
    const newEnfant: Enfant = { id: crypto.randomUUID(), prenom: '', age: 0, aCharge: true, lienParente: '' }
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

  // --- Conjoint ---
  const updateConjoint = (patch: Partial<{ prenom: string; nom: string; dateNaissance: string; situationProfessionnelle: SituationProfessionnelle | '' }>) => {
    const current = situationFamiliale.conjoint ?? { prenom: '', nom: '', dateNaissance: '', situationProfessionnelle: '' as const }
    updateFamiliale({ conjoint: { ...current, ...patch } })
  }

  // --- Donations ---
  const addDonation = () => {
    const newDonation: Donation = {
      id: crypto.randomUUID(),
      montant: 0,
      date: '',
      beneficiaire: '',
      type: 'manuel',
    }
    const donations = [...situationFamiliale.donations, newDonation]
    updateFamiliale({ donations, hasDonation: true })
  }

  const removeDonation = (id: string) => {
    const donations = situationFamiliale.donations.filter(d => d.id !== id)
    updateFamiliale({ donations, hasDonation: donations.length > 0 })
  }

  const updateDonation = (id: string, patch: Partial<Donation>) => {
    updateFamiliale({
      donations: situationFamiliale.donations.map(d => d.id === id ? { ...d, ...patch } : d)
    })
  }

  return (
    <div>
      <SectionHeader
        title="Situation familiale & matrimoniale"
        subtitle="Composition du foyer et régime matrimonial"
        icon={<Users size={18} />}
      />

      <div className="space-y-4">
        {/* Statut marital */}
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
            {showDateUnion && (
              <InputField
                label={situationFamiliale.statutMarital === 'pacse' ? 'Date du PACS' : 'Date du mariage'}
                type="date"
                value={situationFamiliale.dateUnion}
                onChange={(v) => updateFamiliale({ dateUnion: v })}
              />
            )}
          </div>
        </Card>

        {/* Conjoint */}
        {showConjoint && (
          <Card>
            <h3 className="text-sm font-medium text-ink-800 mb-4">
              {situationFamiliale.statutMarital === 'concubinage' ? 'Concubin(e)' : 'Conjoint(e)'}
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <InputField
                label="Prénom"
                value={situationFamiliale.conjoint?.prenom ?? ''}
                onChange={(v) => updateConjoint({ prenom: v })}
                placeholder="Prénom"
              />
              <InputField
                label="Nom"
                value={situationFamiliale.conjoint?.nom ?? ''}
                onChange={(v) => updateConjoint({ nom: v })}
                placeholder="Nom de famille"
              />
              <InputField
                label="Date de naissance"
                type="date"
                value={situationFamiliale.conjoint?.dateNaissance ?? ''}
                onChange={(v) => updateConjoint({ dateNaissance: v })}
              />
              <SelectField
                label="Situation professionnelle"
                value={situationFamiliale.conjoint?.situationProfessionnelle ?? ''}
                onChange={(v) => updateConjoint({ situationProfessionnelle: v as SituationProfessionnelle | '' })}
                options={SITUATION_PROFESSIONNELLE_OPTIONS}
              />
            </div>
          </Card>
        )}

        {/* Enfants */}
        <Card>
          <h3 className="text-sm font-medium text-ink-800 mb-4">Enfants</h3>
          <NumberStepper
            label="Nombre d'enfants"
            value={situationFamiliale.nombreEnfants}
            onChange={setNombreEnfants}
            max={15}
          />

          {situationFamiliale.enfants.length > 0 && (
            <div className="mt-4 space-y-3">
              {situationFamiliale.enfants.map((enfant, i) => (
                <div key={enfant.id} className="p-3 bg-surface-2 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-500">Enfant {i + 1}</span>
                    <button
                      onClick={() => removeEnfant(enfant.id)}
                      className="w-6 h-6 rounded flex items-center justify-center text-ink-400 hover:text-neg-600 hover:bg-neg-50 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <InputField
                      label="Prénom"
                      value={enfant.prenom}
                      onChange={(v) => updateEnfant(enfant.id, { prenom: v })}
                      placeholder="Prénom"
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-ink-600 uppercase tracking-wide">Âge</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={enfant.age}
                          onChange={(e) => updateEnfant(enfant.id, { age: parseInt(e.target.value) || 0 })}
                          className="w-full h-10 rounded-lg border border-ink-100 bg-surface-1 text-ink-800 text-sm px-3 focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-50"
                          min={0}
                          max={50}
                        />
                      </div>
                    </div>
                    <SelectField
                      label="Lien de parenté"
                      value={enfant.lienParente}
                      onChange={(v) => updateEnfant(enfant.id, { lienParente: v as Enfant['lienParente'] })}
                      options={LIEN_PARENTE_OPTIONS}
                    />
                  </div>
                  <ToggleField
                    label="À charge"
                    checked={enfant.aCharge}
                    onChange={(v) => updateEnfant(enfant.id, { aCharge: v })}
                  />
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

        {/* Documents & dispositions */}
        <Card>
          <h3 className="text-sm font-medium text-ink-800 mb-4">Documents & dispositions</h3>
          <div className="space-y-3">
            <ToggleField
              label="Testament existant"
              hint="Le client a rédigé un testament"
              checked={situationFamiliale.hasTestament}
              onChange={(v) => updateFamiliale({ hasTestament: v })}
            />

            {situationFamiliale.hasTestament && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 pl-4 border-l-2 border-navy-100 ml-1">
                <SelectField
                  label="Type de testament"
                  value={situationFamiliale.typeTestament}
                  onChange={(v) => updateFamiliale({ typeTestament: v as 'olographe' | 'authentique' | '' })}
                  options={TYPE_TESTAMENT_OPTIONS}
                />
                <InputField
                  label="Date du testament"
                  type="date"
                  value={situationFamiliale.dateTestament}
                  onChange={(v) => updateFamiliale({ dateTestament: v })}
                />
              </div>
            )}
          </div>

          {/* Donations structurées */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-ink-800">Donations</h4>
              <button
                onClick={addDonation}
                className="flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-800 transition-colors"
              >
                <Plus size={14} />
                Ajouter une donation
              </button>
            </div>

            {situationFamiliale.donations.length === 0 && (
              <p className="text-xs text-ink-400 italic">Aucune donation renseignée</p>
            )}

            {situationFamiliale.donations.length > 0 && (
              <div className="space-y-3">
                {situationFamiliale.donations.map((donation, i) => (
                  <div key={donation.id} className="p-3 bg-surface-2 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-ink-500">Donation {i + 1}</span>
                      <button
                        onClick={() => removeDonation(donation.id)}
                        className="w-6 h-6 rounded flex items-center justify-center text-ink-400 hover:text-neg-600 hover:bg-neg-50 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Bénéficiaire"
                        value={donation.beneficiaire}
                        onChange={(v) => updateDonation(donation.id, { beneficiaire: v })}
                        placeholder="Nom du bénéficiaire"
                      />
                      <SelectField
                        label="Type"
                        value={donation.type}
                        onChange={(v) => updateDonation(donation.id, { type: v as Donation['type'] })}
                        options={TYPE_DONATION_OPTIONS}
                      />
                      <InputField
                        label="Montant (€)"
                        type="number"
                        value={donation.montant}
                        onChange={(v) => updateDonation(donation.id, { montant: parseFloat(v) || 0 })}
                        suffix="€"
                        min={0}
                      />
                      <InputField
                        label="Date"
                        type="date"
                        value={donation.date}
                        onChange={(v) => updateDonation(donation.id, { date: v })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
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

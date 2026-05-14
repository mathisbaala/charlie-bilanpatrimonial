'use client'

import { useBilan } from '@/context/BilanContext'
import { InputField, SelectField, TextareaField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tooltip } from '@/components/ui/Tooltip'
import { User } from 'lucide-react'

const CIVILITE_OPTIONS = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
  { value: 'Dr', label: 'Dr' },
  { value: 'Me', label: 'Me' },
]

const SITUATION_PRO_OPTIONS = [
  { value: 'salarie', label: 'Salarié(e)' },
  { value: 'tns', label: 'TNS (Travailleur Non Salarié)' },
  { value: 'dirigeant', label: "Dirigeant(e) d'entreprise" },
  { value: 'retraite', label: 'Retraité(e)' },
  { value: 'sans_emploi', label: 'Sans emploi' },
  { value: 'autre', label: 'Autre' },
]

export function IdentiteSection() {
  const { bilan, updateIdentite } = useBilan()
  const { identite } = bilan

  return (
    <div>
      <SectionHeader
        title="Identité & Situation personnelle"
        subtitle="Informations personnelles du client"
        icon={<User size={18} />}
      />
      <Card>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <SelectField
            label="Civilité"
            value={identite.civilite}
            onChange={(v) => updateIdentite({ civilite: v as Civilite })}
            options={CIVILITE_OPTIONS}
          />
          <InputField
            label="Nom"
            value={identite.nom}
            onChange={(v) => updateIdentite({ nom: v })}
            placeholder="Dupont"
            required
          />
          <InputField
            label="Prénom"
            value={identite.prenom}
            onChange={(v) => updateIdentite({ prenom: v })}
            placeholder="Marie"
            required
          />
          <InputField
            label="Date de naissance"
            value={identite.dateNaissance}
            onChange={(v) => updateIdentite({ dateNaissance: v })}
            type="date"
            required
          />
          <InputField
            label="Nationalité"
            value={identite.nationalite}
            onChange={(v) => updateIdentite({ nationalite: v })}
            placeholder="Française"
          />
          <SelectField
            label="Situation professionnelle"
            value={identite.situationProfessionnelle}
            onChange={(v) => updateIdentite({ situationProfessionnelle: v as SituationProfessionnelle })}
            options={SITUATION_PRO_OPTIONS}
            required
          />
          <InputField
            label="Profession détaillée"
            value={identite.professionDetaille}
            onChange={(v) => updateIdentite({ professionDetaille: v })}
            placeholder="Ex: Chirurgien orthopédiste, CHU Bordeaux"
          />
        </div>

        <div className="mt-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-ink-100" />
            <span className="text-xs text-ink-400 uppercase tracking-wider">Coordonnées</span>
            <div className="h-px flex-1 bg-ink-100" />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div className="col-span-2">
              <InputField
                label="Adresse"
                value={identite.adresse}
                onChange={(v) => updateIdentite({ adresse: v })}
                placeholder="15 rue de la Paix"
              />
            </div>
            <InputField
              label="Code postal"
              value={identite.codePostal}
              onChange={(v) => updateIdentite({ codePostal: v })}
              placeholder="75001"
            />
            <InputField
              label="Ville"
              value={identite.ville}
              onChange={(v) => updateIdentite({ ville: v })}
              placeholder="Paris"
            />
            <InputField
              label="Pays de résidence fiscale"
              value={identite.paysResidenceFiscale}
              onChange={(v) => updateIdentite({ paysResidenceFiscale: v })}
              placeholder="France"
            />
            <InputField
              label="Email"
              value={identite.email}
              onChange={(v) => updateIdentite({ email: v })}
              type="email"
              placeholder="marie.dupont@email.com"
            />
            <InputField
              label="Téléphone"
              value={identite.telephone}
              onChange={(v) => updateIdentite({ telephone: v })}
              type="tel"
              placeholder="+33 6 12 34 56 78"
            />
          </div>
        </div>

        {/* PEP bloc */}
        <div className="pt-4 border-t border-ink-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={identite.isPEP}
              onChange={(e) => updateIdentite({ isPEP: e.target.checked })}
              className="w-4 h-4 rounded border-ink-300 text-navy-600 focus:ring-navy-50"
            />
            <span className="text-sm font-medium text-ink-700">
              Personne Politiquement Exposée (PEP)
            </span>
            <Tooltip content="Personne exerçant ou ayant exercé une fonction publique importante (ministre, élu, dirigeant d'État). Obligations KYC renforcées." />
          </label>
          {identite.isPEP && (
            <div className="mt-3">
              <TextareaField
                label="Description de la fonction"
                value={identite.descriptionPEP}
                onChange={(v) => updateIdentite({ descriptionPEP: v })}
                placeholder="Ex: Ancien maire de Lyon (2010-2020)"
                rows={2}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// Local type aliases to avoid import issues (types are re-exported from context)
type Civilite = 'M.' | 'Mme' | 'Dr' | 'Me'
type SituationProfessionnelle = 'salarie' | 'tns' | 'dirigeant' | 'retraite' | 'sans_emploi' | 'autre'

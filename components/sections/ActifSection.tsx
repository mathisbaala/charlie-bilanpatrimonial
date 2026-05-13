'use client'

import { useState } from 'react'
import { useBilan } from '@/context/BilanContext'
import { InputField, SelectField } from '@/components/ui/FormField'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatEuros } from '@/lib/calculations'
import type { BienImmobilier, ActifFinancier, ActifProfessionnel } from '@/lib/types'
import { Building2, Plus, Trash2 } from 'lucide-react'

type ActiveTab = 'immobilier' | 'financier' | 'professionnel'

const BIEN_IMMO_OPTIONS = [
  { value: 'residence_principale', label: 'Résidence principale' },
  { value: 'residence_secondaire', label: 'Résidence secondaire' },
  { value: 'locatif_nu', label: 'Locatif nu' },
  { value: 'locatif_meuble', label: 'Locatif meublé' },
  { value: 'lmnp', label: 'LMNP' },
  { value: 'scpi', label: 'SCPI' },
  { value: 'opci', label: 'OPCI' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'autre', label: 'Autre' },
]

const FINANCEMENT_OPTIONS = [
  { value: 'comptant', label: 'Comptant' },
  { value: 'credit', label: 'À crédit' },
  { value: 'mixte', label: 'Mixte' },
]

const ACTIF_FIN_OPTIONS = [
  { value: 'assurance_vie', label: 'Assurance-vie' },
  { value: 'pea', label: 'PEA' },
  { value: 'per', label: 'PER' },
  { value: 'compte_titres', label: 'Compte-titres' },
  { value: 'livret_a', label: 'Livret A' },
  { value: 'ldds', label: 'LDDS' },
  { value: 'lep', label: 'LEP' },
  { value: 'crypto', label: 'Crypto-actifs' },
  { value: 'crowdfunding', label: 'Crowdfunding' },
  { value: 'autre', label: 'Autre placement' },
]

const ORIGINE_PER_OPTIONS = [
  { value: 'volontaire', label: 'Versements volontaires' },
  { value: 'entreprise', label: "Versements d'entreprise" },
  { value: 'mixte', label: 'Mixte' },
]

function createBienImmo(): BienImmobilier {
  return { id: crypto.randomUUID(), type: 'residence_principale', libelle: '', valeurEstimee: 0, dateAcquisition: '', modeFinancement: '' }
}
function createActifFin(): ActifFinancier {
  return { id: crypto.randomUUID(), type: 'assurance_vie', libelle: '', etablissement: '', valeur: 0 }
}
function createActifPro(): ActifProfessionnel {
  return { id: crypto.randomUUID(), libelle: '', valeurEstimee: 0, description: '' }
}

export function ActifSection() {
  const { bilan, updateActif } = useBilan()
  const { actif } = bilan
  const [activeTab, setActiveTab] = useState<ActiveTab>('immobilier')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Immobilier handlers
  const addImmo = () => {
    const item = createBienImmo()
    updateActif({ immobilier: [...actif.immobilier, item] })
    setExpandedId(item.id)
  }
  const removeImmo = (id: string) => updateActif({ immobilier: actif.immobilier.filter(i => i.id !== id) })
  const updateImmo = (id: string, patch: Partial<BienImmobilier>) =>
    updateActif({ immobilier: actif.immobilier.map(i => i.id === id ? { ...i, ...patch } : i) })

  // Financier handlers
  const addFin = () => {
    const item = createActifFin()
    updateActif({ financier: [...actif.financier, item] })
    setExpandedId(item.id)
  }
  const removeFin = (id: string) => updateActif({ financier: actif.financier.filter(i => i.id !== id) })
  const updateFin = (id: string, patch: Partial<ActifFinancier>) =>
    updateActif({ financier: actif.financier.map(i => i.id === id ? { ...i, ...patch } : i) })

  // Professionnel handlers
  const addPro = () => {
    const item = createActifPro()
    updateActif({ professionnel: [...actif.professionnel, item] })
    setExpandedId(item.id)
  }
  const removePro = (id: string) => updateActif({ professionnel: actif.professionnel.filter(i => i.id !== id) })
  const updatePro = (id: string, patch: Partial<ActifProfessionnel>) =>
    updateActif({ professionnel: actif.professionnel.map(i => i.id === id ? { ...i, ...patch } : i) })

  const totalImmo = actif.immobilier.reduce((s, i) => s + (i.valeurEstimee || 0), 0)
  const totalFin = actif.financier.reduce((s, i) => s + (i.valeur || 0), 0)
  const totalPro = actif.professionnel.reduce((s, i) => s + (i.valeurEstimee || 0), 0)

  const tabs: { id: ActiveTab; label: string; count: number; total: number }[] = [
    { id: 'immobilier', label: 'Immobilier', count: actif.immobilier.length, total: totalImmo },
    { id: 'financier', label: 'Financier', count: actif.financier.length, total: totalFin },
    { id: 'professionnel', label: 'Professionnel', count: actif.professionnel.length, total: totalPro },
  ]

  return (
    <div>
      <SectionHeader
        title="Actif patrimonial"
        subtitle="Inventaire des biens et placements du client"
        icon={<Building2 size={18} />}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-surface-2 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === tab.id
                ? 'bg-surface-1 text-ink-950 shadow-sm'
                : 'text-ink-600 hover:text-ink-800'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs text-pos-600 font-semibold">
                {formatEuros(tab.total)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Immobilier tab */}
      {activeTab === 'immobilier' && (
        <div className="space-y-3">
          {actif.immobilier.map((bien) => (
            <Card key={bien.id} padding="sm">
              <div className="flex items-start justify-between mb-3">
                <button
                  onClick={() => setExpandedId(expandedId === bien.id ? null : bien.id)}
                  className="flex-1 text-left"
                >
                  <p className="font-medium text-ink-800 text-sm">{bien.libelle || 'Nouveau bien'}</p>
                  <p className="text-xs text-ink-400">{BIEN_IMMO_OPTIONS.find(o => o.value === bien.type)?.label} · {formatEuros(bien.valeurEstimee)}</p>
                </button>
                <button onClick={() => removeImmo(bien.id)} className="ml-2 p-1.5 text-ink-400 hover:text-neg-600 hover:bg-neg-50 rounded transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              {expandedId === bien.id && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-ink-100">
                  <SelectField label="Type" value={bien.type} onChange={(v) => updateImmo(bien.id, { type: v as BienImmobilier['type'] })} options={BIEN_IMMO_OPTIONS} />
                  <InputField label="Libellé" value={bien.libelle} onChange={(v) => updateImmo(bien.id, { libelle: v })} placeholder="15 rue de la Paix, Paris" />
                  <InputField label="Valeur estimée" value={bien.valeurEstimee || ''} onChange={(v) => updateImmo(bien.id, { valeurEstimee: parseFloat(v) || 0 })} type="number" suffix="€" />
                  <InputField label="Date d'acquisition" value={bien.dateAcquisition} onChange={(v) => updateImmo(bien.id, { dateAcquisition: v })} type="date" />
                  <SelectField label="Mode de financement" value={bien.modeFinancement} onChange={(v) => updateImmo(bien.id, { modeFinancement: v as BienImmobilier['modeFinancement'] })} options={FINANCEMENT_OPTIONS} />
                  {(bien.type === 'scpi' || bien.type === 'opci') && (
                    <InputField label="Nombre de parts" value={bien.nombreParts || ''} onChange={(v) => updateImmo(bien.id, { nombreParts: parseFloat(v) || 0 })} type="number" />
                  )}
                </div>
              )}
            </Card>
          ))}
          <button onClick={addImmo} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-ink-200 text-ink-600 hover:border-navy-600 hover:text-navy-600 transition-colors text-sm">
            <Plus size={16} /> Ajouter un bien immobilier
          </button>
        </div>
      )}

      {/* Financier tab */}
      {activeTab === 'financier' && (
        <div className="space-y-3">
          {actif.financier.map((fin) => (
            <Card key={fin.id} padding="sm">
              <div className="flex items-start justify-between mb-3">
                <button onClick={() => setExpandedId(expandedId === fin.id ? null : fin.id)} className="flex-1 text-left">
                  <p className="font-medium text-ink-800 text-sm">{fin.libelle || ACTIF_FIN_OPTIONS.find(o => o.value === fin.type)?.label || 'Nouveau placement'}</p>
                  <p className="text-xs text-ink-400">{fin.etablissement || '—'} · {formatEuros(fin.valeur)}</p>
                </button>
                <button onClick={() => removeFin(fin.id)} className="ml-2 p-1.5 text-ink-400 hover:text-neg-600 hover:bg-neg-50 rounded transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              {expandedId === fin.id && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-ink-100">
                  <SelectField label="Type" value={fin.type} onChange={(v) => updateFin(fin.id, { type: v as ActifFinancier['type'] })} options={ACTIF_FIN_OPTIONS} />
                  <InputField label="Libellé / nom du contrat" value={fin.libelle} onChange={(v) => updateFin(fin.id, { libelle: v })} placeholder="Contrat Eres 2019" />
                  <InputField label="Établissement" value={fin.etablissement} onChange={(v) => updateFin(fin.id, { etablissement: v })} placeholder="AXA, BNP..." />
                  <InputField label="Valeur" value={fin.valeur || ''} onChange={(v) => updateFin(fin.id, { valeur: parseFloat(v) || 0 })} type="number" suffix="€" />
                  <InputField label="Date d'ouverture" value={fin.dateOuverture || ''} onChange={(v) => updateFin(fin.id, { dateOuverture: v })} type="date" />
                  {fin.type === 'assurance_vie' && (
                    <InputField label="Bénéficiaires" value={fin.beneficiaires || ''} onChange={(v) => updateFin(fin.id, { beneficiaires: v })} placeholder="Conjoint, enfants..." />
                  )}
                  {fin.type === 'per' && (
                    <SelectField label="Origine PER" value={fin.originePER || ''} onChange={(v) => updateFin(fin.id, { originePER: v as ActifFinancier['originePER'] })} options={ORIGINE_PER_OPTIONS} />
                  )}
                </div>
              )}
            </Card>
          ))}
          <button onClick={addFin} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-ink-200 text-ink-600 hover:border-navy-600 hover:text-navy-600 transition-colors text-sm">
            <Plus size={16} /> Ajouter un placement financier
          </button>
        </div>
      )}

      {/* Professionnel tab */}
      {activeTab === 'professionnel' && (
        <div className="space-y-3">
          {actif.professionnel.map((pro) => (
            <Card key={pro.id} padding="sm">
              <div className="flex items-start justify-between mb-3">
                <button onClick={() => setExpandedId(expandedId === pro.id ? null : pro.id)} className="flex-1 text-left">
                  <p className="font-medium text-ink-800 text-sm">{pro.libelle || 'Nouvel actif professionnel'}</p>
                  <p className="text-xs text-ink-400">{pro.denomination || '—'} · {formatEuros(pro.valeurEstimee)}</p>
                </button>
                <button onClick={() => removePro(pro.id)} className="ml-2 p-1.5 text-ink-400 hover:text-neg-600 hover:bg-neg-50 rounded transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              {expandedId === pro.id && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-ink-100">
                  <InputField label="Libellé" value={pro.libelle} onChange={(v) => updatePro(pro.id, { libelle: v })} placeholder="Parts SAS Dupont" />
                  <InputField label="Dénomination société" value={pro.denomination || ''} onChange={(v) => updatePro(pro.id, { denomination: v })} placeholder="SAS Dupont & Associés" />
                  <InputField label="% de détention" value={pro.pourcentageDetention || ''} onChange={(v) => updatePro(pro.id, { pourcentageDetention: parseFloat(v) || 0 })} type="number" suffix="%" />
                  <InputField label="Valeur estimée" value={pro.valeurEstimee || ''} onChange={(v) => updatePro(pro.id, { valeurEstimee: parseFloat(v) || 0 })} type="number" suffix="€" />
                  <div className="col-span-2">
                    <InputField label="Description" value={pro.description} onChange={(v) => updatePro(pro.id, { description: v })} placeholder="Fonds de commerce, brevets..." />
                  </div>
                </div>
              )}
            </Card>
          ))}
          <button onClick={addPro} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-ink-200 text-ink-600 hover:border-navy-600 hover:text-navy-600 transition-colors text-sm">
            <Plus size={16} /> Ajouter un actif professionnel
          </button>
        </div>
      )}
    </div>
  )
}

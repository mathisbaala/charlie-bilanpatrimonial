'use client'

import { useRef } from 'react'
import { useBilan } from '@/context/BilanContext'
import { InputField, TextareaField } from '@/components/ui/FormField'
import { X, Upload, Building } from 'lucide-react'

interface CabinetModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CabinetModal({ isOpen, onClose }: CabinetModalProps) {
  const { cabinet, updateCabinet } = useBilan()
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const result = evt.target?.result as string
      updateCabinet({ logo: result })
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => updateCabinet({ logo: '' })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-950/25 backdrop-blur-[2px] z-50"
        onClick={onClose}
      />

      {/* Modal — panneau flottant, ancré dans la page (arrondi, marge, ombre douce) */}
      <div className="fixed inset-3 sm:inset-y-4 sm:left-auto sm:right-4 sm:w-full sm:max-w-lg bg-surface-1 z-50 flex flex-col rounded-2xl border border-ink-100 shadow-[0_24px_60px_-12px_rgba(26,20,16,0.30)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold-500/15 flex items-center justify-center">
              <Building size={16} className="text-gold-600" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-ink-950">Paramètres cabinet</h2>
              <p className="text-xs text-ink-400">Ces informations apparaîtront dans le PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-800 hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Logo upload */}
          <div>
            <label className="text-xs font-medium text-ink-600 uppercase tracking-wide block mb-2">
              Logo du cabinet
            </label>
            {cabinet.logo ? (
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 rounded-xl border border-ink-100 bg-surface-2 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cabinet.logo} alt="Logo cabinet" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-gold-600 hover:text-gold-500 transition-colors"
                  >
                    Changer le logo
                  </button>
                  <button
                    onClick={removeLogo}
                    className="text-xs text-ink-400 hover:text-neg-600 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 rounded-xl border-2 border-dashed border-ink-200 flex flex-col items-center justify-center gap-1.5 text-ink-400 hover:border-gold-500 hover:text-gold-600 transition-colors"
              >
                <Upload size={18} />
                <span className="text-xs">Cliquez pour uploader votre logo (PNG, JPG, SVG)</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          {/* Cabinet info */}
          <div className="space-y-4">
            <InputField
              label="Nom du cabinet"
              value={cabinet.nomCabinet}
              onChange={(v) => updateCabinet({ nomCabinet: v })}
              placeholder="Cabinet Dupont Patrimoine"
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Prénom du conseiller"
                value={cabinet.prenomConseiller}
                onChange={(v) => updateCabinet({ prenomConseiller: v })}
                placeholder="Jean"
              />
              <InputField
                label="Nom du conseiller"
                value={cabinet.nomConseiller}
                onChange={(v) => updateCabinet({ nomConseiller: v })}
                placeholder="Dupont"
              />
            </div>
            <InputField
              label="Numéro ORIAS"
              value={cabinet.numeroOrias}
              onChange={(v) => updateCabinet({ numeroOrias: v })}
              placeholder="12 345 678"
              hint="Numéro d'immatriculation obligatoire (ORIAS)"
              required
            />
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium text-ink-600 uppercase tracking-wider">Coordonnées</h3>
            <InputField
              label="Adresse"
              value={cabinet.adresse}
              onChange={(v) => updateCabinet({ adresse: v })}
              placeholder="15 avenue des Champs-Élysées, 75008 Paris"
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Téléphone"
                value={cabinet.telephone}
                onChange={(v) => updateCabinet({ telephone: v })}
                placeholder="+33 1 23 45 67 89"
                type="tel"
              />
              <InputField
                label="Email"
                value={cabinet.email}
                onChange={(v) => updateCabinet({ email: v })}
                placeholder="contact@cabinet.fr"
                type="email"
              />
            </div>
          </div>

          {/* Legal */}
          <div>
            <TextareaField
              label="Mentions légales personnalisées"
              value={cabinet.mentionsLegales}
              onChange={(v) => updateCabinet({ mentionsLegales: v })}
              rows={4}
              hint="Ces mentions apparaîtront sur la dernière page du PDF"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ink-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-ink-600 hover:bg-surface-2 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-gold-500 text-white hover:bg-gold-600 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </>
  )
}

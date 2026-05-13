'use client'

import { useBilan } from '@/context/BilanContext'
import type { SectionId } from '@/context/BilanContext'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { formatEuros } from '@/lib/calculations'
import {
  User, Users, Building2, CreditCard, TrendingUp,
  Calculator, Shield, Target, Settings
} from 'lucide-react'
import dynamic from 'next/dynamic'

const PDFButton = dynamic(
  () => import('@/components/pdf/PDFButton').then(m => m.PDFButton),
  { ssr: false, loading: () => null }
)

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode; getProgress: (bilan: any) => number }[] = [
  {
    id: 'identite',
    label: 'Identité',
    icon: <User size={16} />,
    getProgress: (bilan) => {
      const fields = [bilan.identite.nom, bilan.identite.prenom, bilan.identite.dateNaissance, bilan.identite.situationProfessionnelle]
      return Math.round((fields.filter(Boolean).length / fields.length) * 100)
    },
  },
  {
    id: 'familiale',
    label: 'Situation familiale',
    icon: <Users size={16} />,
    getProgress: (bilan) => (bilan.situationFamiliale.statutMarital ? 100 : 0),
  },
  {
    id: 'actif',
    label: 'Actif',
    icon: <Building2 size={16} />,
    getProgress: (bilan) => {
      const total = bilan.actif.immobilier.length + bilan.actif.financier.length + bilan.actif.professionnel.length
      return total > 0 ? 100 : 0
    },
  },
  {
    id: 'passif',
    label: 'Passif',
    icon: <CreditCard size={16} />,
    getProgress: (bilan) => (bilan.passif.credits.length > 0 || bilan.passif.autresDettes > 0 ? 100 : 0),
  },
  {
    id: 'revenus',
    label: 'Revenus & Charges',
    icon: <TrendingUp size={16} />,
    getProgress: (bilan) => {
      const r = bilan.revenusCharges.revenus
      const total = r.salaireNet + r.bicBnc + r.revenusFonciers + r.dividendes + r.pensions + r.autresRevenus
      return total > 0 ? 100 : 0
    },
  },
  {
    id: 'fiscalite',
    label: 'Fiscalité',
    icon: <Calculator size={16} />,
    getProgress: (bilan) => (bilan.fiscalite.revenuImposable > 0 ? 100 : 0),
  },
  {
    id: 'profil_risque',
    label: 'Profil de risque',
    icon: <Shield size={16} />,
    getProgress: (bilan) => {
      const pr = bilan.profilRisque
      const filled = [pr.objectif, pr.horizon, pr.experience, pr.capacitePertes, pr.reactionBaisse].filter(Boolean).length
      return Math.round((filled / 5) * 100)
    },
  },
  {
    id: 'objectifs',
    label: 'Objectifs',
    icon: <Target size={16} />,
    getProgress: (bilan) => {
      const selected = bilan.objectifs.objectifs.filter((o: any) => o.selected).length
      return selected > 0 ? 100 : 0
    },
  },
]

export function Sidebar({ onOpenCabinet }: { onOpenCabinet: () => void }) {
  const { bilan, calculations, activeSection, setActiveSection } = useBilan()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-navy-900 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-gold-500 flex items-center justify-center">
            <span className="text-white font-serif text-xs font-bold">C</span>
          </div>
          <div>
            <p className="text-white font-serif text-sm leading-none">Charlie</p>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mt-0.5">Bilan Patrimonial</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id
          const progress = section.getProgress(bilan)
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{ borderLeftColor: isActive ? '#C09F65' : 'transparent' }}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 border-l-2
                ${isActive
                  ? 'bg-white/10 text-white pl-[14px]'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              <div className={`flex-shrink-0 ${isActive ? 'text-gold-400' : 'text-white/40'}`}>
                {section.icon}
              </div>
              <span className="flex-1 text-sm font-medium truncate">{section.label}</span>
              <ProgressRing
                progress={progress}
                size={22}
                strokeWidth={2.5}
                color={progress === 100 ? '#1E7A4F' : '#A8874A'}
              />
            </button>
          )
        })}
      </nav>

      {/* Récap patrimonial */}
      <div className="px-4 py-3 border-t border-white/10 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-white/50 text-xs">Total Actif</span>
          <span className="text-white/80 text-xs font-medium">{formatEuros(calculations.totalActif)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/50 text-xs">Total Passif</span>
          <span className="text-white/80 text-xs font-medium">{formatEuros(calculations.totalPassif)}</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-white/10">
          <span className="text-gold-400 text-xs font-medium">Patrimoine Net</span>
          <span className="text-sm font-semibold">
            <span style={{ color: calculations.patrimoineNet >= 0 ? '#269163' : '#B52D42' }}>
              {formatEuros(calculations.patrimoineNet)}
            </span>
          </span>
        </div>
      </div>

      {/* Settings + PDF buttons */}
      <div className="px-4 py-3 space-y-2 border-t border-white/10">
        <button
          onClick={onOpenCabinet}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm"
        >
          <Settings size={14} />
          <span>Paramètres cabinet</span>
        </button>
        <PDFButton />
      </div>
    </aside>
  )
}

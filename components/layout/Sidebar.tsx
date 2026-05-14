'use client'

import { useBilan } from '@/context/BilanContext'
import type { SectionId } from '@/context/BilanContext'
import { ProgressRing } from '@/components/ui/ProgressRing'
import type { BilanData } from '@/lib/types'
import {
  User, Users, Building2, CreditCard, TrendingUp,
  Calculator, Shield, Target, Settings, Upload
} from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'

const PDFButton = dynamic(
  () => import('@/components/pdf/PDFButton').then(m => m.PDFButton),
  { ssr: false, loading: () => null }
)

function computeSectionCompletude(sectionId: SectionId, bilan: BilanData): number {
  switch (sectionId) {
    case 'identite': {
      const fields = [bilan.identite.civilite, bilan.identite.nom, bilan.identite.prenom, bilan.identite.dateNaissance, bilan.identite.situationProfessionnelle]
      return Math.round(fields.filter(Boolean).length / fields.length * 100)
    }
    case 'familiale':
      return bilan.situationFamiliale.statutMarital ? 100 : 0
    case 'actif': {
      const hasImmo = bilan.actif.immobilier.length > 0
      const hasFinancier = bilan.actif.financier.length > 0
      return (hasImmo || hasFinancier) ? 100 : 0
    }
    case 'passif': {
      // 0% si aucune donnée saisie — l'utilisateur doit confirmer explicitement qu'il n'a pas de dettes
      if (bilan.passif.credits.length === 0) return 0
      const complete = bilan.passif.credits.every(c => c.capitalRestantDu > 0 && c.mensualite > 0)
      return complete ? 100 : 50
    }
    case 'revenus': {
      const r = bilan.revenusCharges.revenus
      return (r.salaireNet > 0 || r.bicBnc > 0 || r.pensions > 0) ? 100 : 0
    }
    case 'fiscalite': {
      // nombrePartsQF vaut 1 par défaut — on ne le compte que si revenuImposable est aussi renseigné
      const hasRevenu = bilan.fiscalite.revenuImposable > 0
      const hasParts = bilan.fiscalite.nombrePartsQF > 1 || (hasRevenu && bilan.fiscalite.nombrePartsQF > 0)
      if (!hasRevenu && !hasParts) return 0
      return Math.round([hasRevenu, hasParts].filter(Boolean).length / 2 * 100)
    }
    case 'profil_risque': {
      const pr = bilan.profilRisque
      const answered = [pr.objectif, pr.horizon, pr.experience, pr.capacitePertes, pr.reactionBaisse, pr.toleranceIlliquidite, pr.classificationClient].filter(Boolean).length
      return Math.round(answered / 7 * 100)
    }
    case 'objectifs':
      return bilan.objectifs.objectifs.some(o => o.selected) ? 100 : 0
    default:
      return 0
  }
}

function ringColor(completude: number): string {
  if (completude === 100) return '#5A9E6F'
  if (completude >= 50) return '#A8874A'
  return '#B0A898'
}

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'identite',      label: 'Identité',           icon: <User size={15} /> },
  { id: 'familiale',     label: 'Situation familiale', icon: <Users size={15} /> },
  { id: 'actif',         label: 'Actif',               icon: <Building2 size={15} /> },
  { id: 'passif',        label: 'Passif',              icon: <CreditCard size={15} /> },
  { id: 'revenus',       label: 'Revenus & Charges',   icon: <TrendingUp size={15} /> },
  { id: 'fiscalite',     label: 'Fiscalité',           icon: <Calculator size={15} /> },
  { id: 'profil_risque', label: 'Profil de risque',    icon: <Shield size={15} /> },
  { id: 'objectifs',     label: 'Objectifs',           icon: <Target size={15} /> },
]

export function Sidebar({
  onOpenCabinet,
  onOpenImport,
}: {
  onOpenCabinet: () => void
  onOpenImport: () => void
}) {
  const { bilan, activeSection, setActiveSection } = useBilan()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40" style={{
      backgroundColor: '#1E1C18',
      borderRight: '1px solid #2E2B25',
    }}>

      {/* Logo */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #2E2B25' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex-shrink-0">
            <Image
              src="/charlie-favicon.png"
              alt="Charlie"
              width={32}
              height={32}
              className="w-8 h-8"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <div>
            <p style={{ color: '#EDE9E0', fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1, marginBottom: 3 }}>
              Charlie
            </p>
            <p style={{ color: '#6B6660', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Bilan Patrimonial
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id
          const completude = computeSectionCompletude(section.id, bilan)
          const color = ringColor(completude)
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150"
              style={{
                borderLeft: `2px solid ${isActive ? '#A8874A' : 'transparent'}`,
                backgroundColor: isActive ? 'rgba(168,135,74,0.10)' : 'transparent',
                paddingLeft: isActive ? 14 : 16,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            >
              <div style={{ color: isActive ? '#C09F65' : '#5A5650', flexShrink: 0 }}>
                {section.icon}
              </div>
              <span className="flex-1 text-sm font-medium truncate" style={{ color: isActive ? '#EDE9E0' : '#8A8680' }}>
                {section.label}
              </span>
              <div className="relative flex-shrink-0 flex items-center justify-center" style={{ width: 30, height: 30 }}>
                <ProgressRing progress={completude} size={30} strokeWidth={2.5} color={color} />
                <span className="absolute text-[7.5px] font-bold leading-none" style={{ color }}>
                  {completude}%
                </span>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Actions */}
      <div className="px-4 py-3 space-y-1.5" style={{ borderTop: '1px solid #2E2B25' }}>
        {/* Import client */}
        <button
          onClick={onOpenImport}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: '#C09F65', backgroundColor: 'rgba(168,135,74,0.08)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(168,135,74,0.15)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(168,135,74,0.08)')}
        >
          <Upload size={13} />
          <span>Importer un client</span>
        </button>

        <button
          onClick={onOpenCabinet}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: '#6B6660' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#8A8680'; (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6B6660'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
        >
          <Settings size={13} />
          <span>Paramètres cabinet</span>
        </button>

        <PDFButton />
      </div>
    </aside>
  )
}

'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useBilan } from '@/context/BilanContext'
import { IdentiteSection } from '@/components/sections/IdentiteSection'
import { FamilialeSection } from '@/components/sections/FamilialeSection'
import { ActifSection } from '@/components/sections/ActifSection'
import { PassifSection } from '@/components/sections/PassifSection'
import { RevenusSection } from '@/components/sections/RevenusSection'
import { FiscaliteSection } from '@/components/sections/FiscaliteSection'
import { ProfilRisqueSection } from '@/components/sections/ProfilRisqueSection'
import { ObjectifsSection } from '@/components/sections/ObjectifsSection'
import { CabinetModal } from '@/components/layout/CabinetModal'
import { ImportModal } from '@/components/layout/ImportModal'
import { CharlieParcoursHeader } from '@/components/CharlieParcoursHeader'
import { ContinueToScreenerButton } from '@/components/ContinueToScreenerButton'

function WelcomeBanner() {
  const { bilan, calculations } = useBilan()
  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ')
  const profilLabel: Record<string, string> = {
    prudent: 'Prudent',
    equilibre: 'Équilibré',
    dynamique: 'Dynamique',
    offensif: 'Offensif',
  }

  if (!clientName) return null

  const canContinue = !!bilan.profilRisque.resultat

  return (
    <div className="mb-6 p-4 bg-surface-1 rounded-xl border border-ink-100 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs text-ink-400 mb-0.5">Client en cours</p>
        <p className="text-lg font-semibold text-ink-950 tracking-tight">{clientName}</p>
      </div>
      <div className="flex gap-6 items-center">
        {calculations.totalActif > 0 && (
          <div className="text-right">
            <p className="text-xs text-ink-400">Patrimoine net</p>
            <p
              className="text-sm font-semibold"
              style={{ color: calculations.patrimoineNet >= 0 ? '#1F4535' : '#B91C1C' }}
            >
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              }).format(calculations.patrimoineNet)}
            </p>
          </div>
        )}
        {bilan.profilRisque.resultat && (
          <div className="text-right">
            <p className="text-xs text-ink-400">Profil risque</p>
            <p className="text-sm font-medium text-ink-800">
              {profilLabel[bilan.profilRisque.resultat as keyof typeof profilLabel]}
            </p>
          </div>
        )}
        {canContinue && <ContinueToScreenerButton />}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { activeSection } = useBilan()
  const [cabinetOpen, setCabinetOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const sections: Record<string, React.ReactNode> = {
    identite: <IdentiteSection />,
    familiale: <FamilialeSection />,
    actif: <ActifSection />,
    passif: <PassifSection />,
    revenus: <RevenusSection />,
    fiscalite: <FiscaliteSection />,
    profil_risque: <ProfilRisqueSection />,
    objectifs: <ObjectifsSection />,
  }

  return (
    <div className="min-h-screen bg-surface-0">
      <CharlieParcoursHeader />
      <Sidebar onOpenCabinet={() => setCabinetOpen(true)} onOpenImport={() => setImportOpen(true)} />
      <main className="ml-64 p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <WelcomeBanner />
          <div key={activeSection} className="animate-fadeIn">
            {sections[activeSection]}
          </div>
        </div>
      </main>
      <CabinetModal isOpen={cabinetOpen} onClose={() => setCabinetOpen(false)} />
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}

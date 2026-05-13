'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useBilan } from '@/context/BilanContext'
import { IdentiteSection } from '@/components/sections/IdentiteSection'
import { FamilialeSection } from '@/components/sections/FamilialeSection'
import { ActifSection } from '@/components/sections/ActifSection'
import { PassifSection } from '@/components/sections/PassifSection'
import { RevenusSection } from '@/components/sections/RevenusSection'
import { FiscaliteSection } from '@/components/sections/FiscaliteSection'
import { ProfilRisqueSection } from '@/components/sections/ProfilRisqueSection'
import { ObjectifsSection } from '@/components/sections/ObjectifsSection'

export default function HomePage() {
  const { activeSection, resetBilan } = useBilan()
  const [cabinetOpen, setCabinetOpen] = useState(false)

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
      <Sidebar onOpenCabinet={() => setCabinetOpen(true)} />
      <Header onNewBilan={resetBilan} />
      <main className="ml-64 pt-14 p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {sections[activeSection]}
        </div>
      </main>
      {/* Cabinet modal placeholder */}
      {cabinetOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCabinetOpen(false)}>
          <div className="bg-surface-1 rounded-2xl p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl text-ink-950 mb-4">Paramètres cabinet</h2>
            <p className="text-ink-600 text-sm">En construction...</p>
            <button onClick={() => setCabinetOpen(false)} className="mt-4 text-sm text-ink-600 hover:text-ink-800">Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}

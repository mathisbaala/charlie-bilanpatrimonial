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
import { CabinetModal } from '@/components/layout/CabinetModal'

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
      <CabinetModal isOpen={cabinetOpen} onClose={() => setCabinetOpen(false)} />
    </div>
  )
}

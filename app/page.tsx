'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useBilan } from '@/context/BilanContext'

// Section placeholders (will be replaced in next task)
function SectionPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64 rounded-xl border-2 border-dashed border-ink-200">
      <p className="text-ink-400 font-serif text-xl">{title} — en construction</p>
    </div>
  )
}

export default function HomePage() {
  const { activeSection, resetBilan } = useBilan()
  const [cabinetOpen, setCabinetOpen] = useState(false)

  const sections: Record<string, React.ReactNode> = {
    identite: <SectionPlaceholder title="Identité & Situation" />,
    familiale: <SectionPlaceholder title="Situation familiale" />,
    actif: <SectionPlaceholder title="Actif" />,
    passif: <SectionPlaceholder title="Passif" />,
    revenus: <SectionPlaceholder title="Revenus & Charges" />,
    fiscalite: <SectionPlaceholder title="Fiscalité" />,
    profil_risque: <SectionPlaceholder title="Profil de risque" />,
    objectifs: <SectionPlaceholder title="Objectifs patrimoniaux" />,
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

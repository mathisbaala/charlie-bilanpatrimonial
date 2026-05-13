'use client'

import { useBilan } from '@/context/BilanContext'
import { RotateCcw } from 'lucide-react'

export function Header({ onNewBilan }: { onNewBilan: () => void }) {
  const { bilan, cabinet } = useBilan()

  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join(' ') || 'Nouveau client'
  const lastModified = new Date(bilan.dateDerniereModification).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-surface-1 border-b border-ink-100 flex items-center justify-between px-6 z-30">
      <div className="flex items-center gap-3">
        <h1 className="font-serif text-lg text-ink-950">{clientName}</h1>
        {cabinet.nomCabinet && (
          <>
            <span className="text-ink-200">·</span>
            <span className="text-sm text-ink-600">{cabinet.nomCabinet}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-ink-400">Sauvegardé {lastModified}</span>
        <button
          onClick={onNewBilan}
          className="flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-2"
        >
          <RotateCcw size={12} />
          Nouveau bilan
        </button>
      </div>
    </header>
  )
}

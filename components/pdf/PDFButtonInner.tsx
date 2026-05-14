'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { useBilan } from '@/context/BilanContext'
import { FileText, Loader } from 'lucide-react'
import { BilanPDF } from './BilanPDF'

export function PDFButtonInner() {
  const { bilan, cabinet, calculations } = useBilan()

  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join('_') || 'Client'
  const fileName = `Bilan_Patrimonial_${clientName}_${new Date().toISOString().slice(0, 10)}.pdf`

  return (
    <PDFDownloadLink
      document={<BilanPDF bilan={bilan} cabinet={cabinet} calculations={calculations} />}
      fileName={fileName}
    >
      {({ loading, error }: { loading: boolean; error: Error | null }) => (
        <button
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            loading
              ? 'bg-white/10 text-white/50 cursor-wait'
              : 'text-white hover:opacity-90 shadow-sm'
          }`}
          style={loading ? {} : { backgroundColor: '#A8874A' }}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader size={14} className="animate-spin" />
              <span>Génération...</span>
            </>
          ) : (
            <>
              <FileText size={14} />
              <span>Télécharger le PDF</span>
            </>
          )}
          {error && <span className="text-neg-500 text-xs">Erreur PDF</span>}
        </button>
      )}
    </PDFDownloadLink>
  )
}

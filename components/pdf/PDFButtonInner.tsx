'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { useBilan } from '@/context/BilanContext'
import { FileText, Loader } from 'lucide-react'
import { BilanPDF } from './BilanPDF'
import { useState, useRef } from 'react'
import type { BilanData, BilanCalculations } from '@/lib/types'
import { bilanIsReadyForScreener } from '@/lib/dossier-mapping'
import { goToScreener, formatHandoffError } from '@/lib/screener-handoff'

function computeAlerts(bilan: BilanData, calculations: BilanCalculations) {
  const blocking: string[] = []
  const warnings: string[] = []

  if (calculations.totalActif === 0)
    blocking.push('Aucun actif renseigné')
  if (bilan.fiscalite.revenuImposable === 0 && calculations.revenusMensuelsTotaux === 0)
    blocking.push('Revenu imposable et revenus mensuels = 0')
  const pr = bilan.profilRisque
  const mif2Answered = [pr.objectif, pr.horizon, pr.experience, pr.capacitePertes, pr.reactionBaisse, pr.toleranceIlliquidite].filter(Boolean).length
  if (mif2Answered < 6)
    blocking.push(`Profil MIF2 incomplet (${mif2Answered}/6 questions)`)

  const biensImmoSansPrix = bilan.actif.immobilier.filter(b => !b.prixAcquisition).length
  if (biensImmoSansPrix > 0)
    warnings.push(`Prix d'acquisition manquant sur ${biensImmoSansPrix} bien(s) immobilier(s)`)
  const biensLocatifsSansLoyer = bilan.actif.immobilier
    .filter(b => ['locatif_nu', 'locatif_meuble', 'lmnp', 'scpi'].includes(b.type))
    .filter(b => !b.loyerMensuel).length
  if (biensLocatifsSansLoyer > 0)
    warnings.push(`Loyer mensuel manquant sur ${biensLocatifsSansLoyer} bien(s) locatif(s)`)
  if (!bilan.profilRisque.classificationClient)
    warnings.push('Classification client MIF2 non renseignée')
  if (!bilan.objectifs.objectifs.some(o => o.selected))
    warnings.push('Aucun objectif patrimonial sélectionné')

  return { blocking, warnings }
}

export function PDFButtonInner() {
  const { bilan, cabinet, calculations } = useBilan()
  const [showModal, setShowModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [handoffError, setHandoffError] = useState<string | null>(null)
  const handledUrlRef = useRef<string | null>(null)

  const clientName = [bilan.identite.prenom, bilan.identite.nom].filter(Boolean).join('_') || 'Client'
  const fileName = `Bilan_Patrimonial_${clientName}_${new Date().toISOString().slice(0, 10)}.pdf`

  function handleButtonClick() {
    const alerts = computeAlerts(bilan, calculations)
    if (alerts.blocking.length > 0 || alerts.warnings.length > 0) {
      setShowModal(true)
    } else {
      startGeneration()
    }
  }

  function startGeneration() {
    handledUrlRef.current = null
    setHandoffError(null)
    setGenerating(true)
  }

  // Déclenché une seule fois quand le blob PDF est prêt : télécharge le fichier,
  // puis — si le bilan est complet — enchaîne sur le screener (handoff Charlie).
  function onPdfReady(url: string) {
    if (handledUrlRef.current === url) return
    handledUrlRef.current = url

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()

    setGenerating(false)

    if (bilanIsReadyForScreener(bilan).ready) {
      const montant = Math.round(Math.max(0, (calculations.totalActifFinancier || 0) * 0.2))
      // Court délai pour laisser le téléchargement démarrer avant la navigation.
      setTimeout(() => {
        goToScreener({ bilan, calculations, montant }).catch((err) => {
          setHandoffError(formatHandoffError(err))
        })
      }, 600)
    }
  }

  const alerts = showModal ? computeAlerts(bilan, calculations) : { blocking: [], warnings: [] }

  return (
    <>
      {/* Main trigger button */}
      {!generating && (
        <button
          onClick={handleButtonClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-white hover:opacity-90 shadow-sm"
          style={{ backgroundColor: '#9C7A4E' }}
        >
          <FileText size={14} />
          <span>Télécharger le PDF</span>
        </button>
      )}

      {/* Génère le blob PDF puis déclenche téléchargement + handoff via onPdfReady */}
      {generating && (
        <PDFDownloadLink
          document={<BilanPDF bilan={bilan} cabinet={cabinet} calculations={calculations} />}
          fileName={fileName}
        >
          {({ loading, url, error }) => {
            if (!loading && url && !error) {
              // Effet de bord hors phase de rendu.
              queueMicrotask(() => onPdfReady(url))
            }
            return (
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white/60 bg-white/10 cursor-wait"
                disabled
              >
                <Loader size={14} className="animate-spin" />
                <span>Génération…</span>
                {error && <span className="text-red-500 text-xs">Erreur PDF</span>}
              </button>
            )
          }}
        </PDFDownloadLink>
      )}

      {handoffError && (
        <p className="mt-2 text-xs text-neg-600">{handoffError}</p>
      )}

      {/* Validation modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-navy mb-4">Vérification avant génération</h2>

            {alerts.blocking.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-red-600 mb-2">⚠ Points bloquants :</p>
                <ul className="space-y-1">
                  {alerts.blocking.map((alert, i) => (
                    <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                      <span className="mt-0.5">•</span> {alert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {alerts.warnings.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-amber-600 mb-2">Avertissements :</p>
                <ul className="space-y-1">
                  {alerts.warnings.map((w, i) => (
                    <li key={i} className="text-sm text-amber-600 flex items-start gap-2">
                      <span className="mt-0.5">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-parchment-300 rounded-xl text-sm font-medium text-ink-700 hover:bg-parchment-50"
              >
                Retourner corriger
              </button>
              <button
                onClick={() => { setShowModal(false); startGeneration() }}
                className="flex-1 px-4 py-2 bg-navy text-white rounded-xl text-sm font-medium hover:bg-navy/90"
              >
                Générer quand même
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

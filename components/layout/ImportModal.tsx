'use client'

import { useState, useRef, useCallback } from 'react'
import { useBilan } from '@/context/BilanContext'
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import type { ExtractedClientData } from '@/app/api/import/route'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
}

const FIELD_LABELS: Record<string, string> = {
  civilite: 'Civilité',
  nom: 'Nom',
  prenom: 'Prénom',
  dateNaissance: 'Date de naissance',
  nationalite: 'Nationalité',
  email: 'Email',
  telephone: 'Téléphone',
  adresse: 'Adresse',
  situationProfessionnelle: 'Situation professionnelle',
  professionDetaille: 'Profession',
  statutMarital: 'Statut marital',
  regimeMatrimonial: 'Régime matrimonial',
  revenuImposable: 'Revenu imposable (€)',
  nombrePartsQF: 'Nombre de parts QF',
  salaireNet: 'Salaire net (€)',
  revenusFonciers: 'Revenus fonciers (€)',
}

const SITPRO_LABELS: Record<string, string> = {
  salarie: 'Salarié', tns: 'TNS', dirigeant: 'Dirigeant', retraite: 'Retraité',
}
const STATUT_LABELS: Record<string, string> = {
  marie: 'Marié(e)', pacse: 'Pacsé(e)', celibataire: 'Célibataire', divorce: 'Divorcé(e)', veuf: 'Veuf / Veuve',
}
const REGIME_LABELS: Record<string, string> = {
  communaute_legale: 'Communauté légale', separation_biens: 'Séparation de biens',
  communaute_universelle: 'Communauté universelle', participation_acquets: 'Participation aux acquêts',
}

function displayValue(field: string, value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') return '—'
  if (field === 'situationProfessionnelle') return SITPRO_LABELS[value as string] || String(value)
  if (field === 'statutMarital') return STATUT_LABELS[value as string] || String(value)
  if (field === 'regimeMatrimonial') return REGIME_LABELS[value as string] || String(value)
  if (typeof value === 'number') return value.toLocaleString('fr-FR') + (['revenuImposable', 'salaireNet', 'revenusFonciers'].includes(field) ? ' €' : '')
  if (field === 'dateNaissance' && typeof value === 'string' && value.includes('-')) {
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }
  return String(value)
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { updateIdentite, updateFamiliale, updateFiscalite, updateRevenusCharges } = useBilan()

  const [step, setStep] = useState<'upload' | 'loading' | 'preview' | 'done'>('upload')
  const [dragOver, setDragOver] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [extracted, setExtracted] = useState<ExtractedClientData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setStep('upload')
    setDragOver(false)
    setPastedText('')
    setExtracted(null)
    setError(null)
    setSelectedFields(new Set())
  }, [])

  const handleClose = () => { reset(); onClose() }

  async function processInput(file?: File, text?: string) {
    setStep('loading')
    setError(null)
    try {
      const fd = new FormData()
      if (file) fd.append('file', file)
      if (text) fd.append('text', text)

      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur serveur')

      const result = data as ExtractedClientData
      setExtracted(result)

      const found = new Set(
        Object.keys(FIELD_LABELS).filter(k => {
          const v = result[k as keyof ExtractedClientData]
          return v !== undefined && v !== null && v !== ''
        })
      )
      setSelectedFields(found)
      setStep('preview')
    } catch (e) {
      setError((e as Error).message)
      setStep('upload')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processInput(file)
  }

  function toggleField(field: string) {
    setSelectedFields(prev => {
      const next = new Set(prev)
      next.has(field) ? next.delete(field) : next.add(field)
      return next
    })
  }

  function applyImport() {
    if (!extracted) return

    // Identité
    const identKeys = ['civilite', 'nom', 'prenom', 'dateNaissance', 'nationalite', 'email', 'telephone', 'adresse', 'situationProfessionnelle', 'professionDetaille'] as const
    const identPayload: Record<string, string> = {}
    for (const k of identKeys) {
      if (selectedFields.has(k) && extracted[k]) identPayload[k] = extracted[k] as string
    }
    if (Object.keys(identPayload).length) updateIdentite(identPayload)

    // Situation familiale
    const famillePayload: Record<string, string> = {}
    if (selectedFields.has('statutMarital') && extracted.statutMarital) famillePayload['statutMarital'] = extracted.statutMarital
    if (selectedFields.has('regimeMatrimonial') && extracted.regimeMatrimonial) famillePayload['regimeMatrimonial'] = extracted.regimeMatrimonial
    if (Object.keys(famillePayload).length) updateFamiliale(famillePayload)

    // Fiscalité
    const fiscalPayload: Record<string, number> = {}
    if (selectedFields.has('revenuImposable') && extracted.revenuImposable) fiscalPayload['revenuImposable'] = extracted.revenuImposable
    if (selectedFields.has('nombrePartsQF') && extracted.nombrePartsQF) fiscalPayload['nombrePartsQF'] = extracted.nombrePartsQF
    if (Object.keys(fiscalPayload).length) updateFiscalite(fiscalPayload)

    // Revenus (nested under revenusCharges.revenus)
    const revenusPayload: Record<string, number> = {}
    if (selectedFields.has('salaireNet') && extracted.salaireNet) revenusPayload['salaireNet'] = extracted.salaireNet
    if (selectedFields.has('revenusFonciers') && extracted.revenusFonciers) revenusPayload['revenusFonciers'] = extracted.revenusFonciers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (Object.keys(revenusPayload).length) updateRevenusCharges({ revenus: revenusPayload } as any)

    setStep('done')
  }

  if (!isOpen) return null

  const foundCount = extracted
    ? Object.keys(FIELD_LABELS).filter(k => { const v = extracted[k as keyof ExtractedClientData]; return v !== undefined && v !== null && v !== '' }).length
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#F5F4F0' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #E0DED7' }}>
          <div>
            <h2 className="font-serif text-xl text-ink-950">Importer un client</h2>
            <p className="text-xs text-ink-400 mt-0.5">
              {step === 'upload' && 'Déposez un document ou collez le texte directement'}
              {step === 'loading' && 'Analyse du document en cours…'}
              {step === 'preview' && `${foundCount} champ${foundCount > 1 ? 's' : ''} détecté${foundCount > 1 ? 's' : ''} — cochez ceux à importer`}
              {step === 'done' && 'Données importées avec succès'}
            </p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-800 hover:bg-ink-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">

          {/* ── Upload ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-neg-50 border border-neg-100">
                  <AlertCircle size={15} className="text-neg-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-neg-600">{error}</p>
                </div>
              )}

              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed transition-all p-8 text-center select-none"
                style={{
                  borderColor: dragOver ? '#A8874A' : '#D0CCC4',
                  backgroundColor: dragOver ? '#FBF7EE' : '#FAFAF8',
                }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F0E8D0' }}>
                    <Upload size={20} style={{ color: '#A8874A' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-800">Déposer ou cliquer pour choisir un fichier</p>
                    <p className="text-xs text-ink-400 mt-1">PDF, TXT acceptés</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.csv"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) processInput(f) }}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ backgroundColor: '#E0DED7' }} />
                <span className="text-xs text-ink-400">ou collez le texte du document</span>
                <div className="flex-1 h-px" style={{ backgroundColor: '#E0DED7' }} />
              </div>

              <div>
                <textarea
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="Collez ici le contenu d'une fiche KYC, d'un avis d'imposition, d'un courrier bancaire…"
                  rows={5}
                  className="w-full rounded-xl border px-4 py-3 text-sm text-ink-800 resize-none placeholder:text-ink-300 focus:outline-none transition-colors"
                  style={{ borderColor: '#E0DED7', backgroundColor: '#FFFFFF' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#A8874A')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E0DED7')}
                />
                <button
                  disabled={pastedText.trim().length < 10}
                  onClick={() => processInput(undefined, pastedText)}
                  className="mt-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#A8874A', color: '#FFFFFF' }}
                >
                  Analyser le texte
                </button>
              </div>
            </div>
          )}

          {/* ── Loading ── */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 size={32} className="animate-spin" style={{ color: '#A8874A' }} />
              <p className="text-sm text-ink-600">Extraction des informations en cours…</p>
            </div>
          )}

          {/* ── Preview ── */}
          {step === 'preview' && extracted && (
            <div className="space-y-2">
              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-ink-400 pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#269163' }} />
                  <span>Haute confiance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#A8874A' }} />
                  <span>Confiance moyenne — vérifier</span>
                </div>
              </div>

              {Object.keys(FIELD_LABELS).map(field => {
                const rawValue = extracted[field as keyof ExtractedClientData]
                const hasValue = rawValue !== undefined && rawValue !== null && rawValue !== ''
                const conf = extracted.confidence[field]
                const isSelected = selectedFields.has(field)

                return (
                  <div
                    key={field}
                    onClick={() => hasValue && toggleField(field)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: hasValue ? (isSelected ? '#FBF7EE' : '#FAFAF8') : 'transparent',
                      border: `1px solid ${hasValue && isSelected ? '#D4B87A' : (hasValue ? '#E0DED7' : 'transparent')}`,
                      cursor: hasValue ? 'pointer' : 'default',
                      opacity: hasValue ? 1 : 0.4,
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: hasValue && isSelected ? '#A8874A' : 'transparent',
                        border: `1.5px solid ${hasValue && isSelected ? '#A8874A' : '#C8C4BC'}`,
                      }}
                    >
                      {hasValue && isSelected && (
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                          <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: '#928E88' }}>{FIELD_LABELS[field]}</p>
                      <p className="text-sm text-ink-800 truncate mt-0.5">{displayValue(field, rawValue as string | number | undefined)}</p>
                    </div>

                    {hasValue && conf && (
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: conf === 'high' ? '#269163' : '#A8874A' }}
                        title={conf === 'high' ? 'Haute confiance' : 'Vérifier'}
                      />
                    )}
                  </div>
                )
              })}

              {foundCount === 0 && (
                <div className="text-center py-8">
                  <FileText size={28} className="mx-auto mb-3" style={{ color: '#C9C7BF' }} />
                  <p className="text-sm text-ink-500">Aucune information reconnue dans ce document.</p>
                  <p className="text-xs text-ink-300 mt-1">Essayez de copier-coller le texte directement.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E4F2EC' }}>
                <CheckCircle size={32} style={{ color: '#269163' }} />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink-800">{selectedFields.size} champ{selectedFields.size > 1 ? 's importés' : ' importé'}</p>
                <p className="text-sm text-ink-400 mt-1">Complétez les informations manquantes manuellement.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === 'preview' || step === 'done') && (
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #E0DED7' }}>
            {step === 'preview' ? (
              <>
                <button onClick={reset} className="px-4 py-2 rounded-lg text-sm transition-colors" style={{ color: '#8E8D87' }}>
                  ← Recommencer
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: '#8E8D87' }}>{selectedFields.size} champ{selectedFields.size > 1 ? 's' : ''} sélectionné{selectedFields.size > 1 ? 's' : ''}</span>
                  <button
                    onClick={applyImport}
                    disabled={selectedFields.size === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                    style={{ backgroundColor: '#1E1C18', color: '#EDE9E0' }}
                  >
                    Importer la sélection
                    <ChevronRight size={13} />
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <button
                  onClick={handleClose}
                  className="px-8 py-2.5 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: '#1E1C18', color: '#EDE9E0' }}
                >
                  Fermer et compléter manuellement
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

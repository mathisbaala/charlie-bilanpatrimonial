'use client'

import { useBilan } from '@/context/BilanContext'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tooltip } from '@/components/ui/Tooltip'
import { Shield } from 'lucide-react'
import type { ProfilRisqueResultat, ToleranceIlliquidite, ClassificationClient } from '@/lib/types'

interface ChoiceButtonProps {
  selected: boolean
  onClick: () => void
  label: string
  description?: string
}

function ChoiceButton({ selected, onClick, label, description }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-150 ${
        selected
          ? 'border-navy-600 bg-navy-50 text-navy-600'
          : 'border-ink-100 bg-surface-1 text-ink-800 hover:border-ink-200 hover:bg-surface-2'
      }`}
    >
      <p className="font-medium" style={{ fontSize: 13 }}>{label}</p>
      {description && <p className="mt-1 opacity-70" style={{ fontSize: 12 }}>{description}</p>}
    </button>
  )
}

const PROFIL_DESCRIPTIONS: Record<ProfilRisqueResultat, { label: string; color: string; bg: string; description: string }> = {
  prudent: {
    label: 'Profil Prudent',
    color: '#1F4535',
    bg: '#F1F9F5',
    description: 'Priorité à la sécurité du capital. Tolérance aux pertes très faible. Horizon court terme. Produits de taux et fonds en euros recommandés.'
  },
  equilibre: {
    label: 'Profil Équilibré',
    color: '#9C7A4E',
    bg: '#F5EFE6',
    description: "Recherche d'un équilibre rendement/risque. Accepte une volatilité modérée. Allocation mixte actions/obligations conseillée."
  },
  dynamique: {
    label: 'Profil Dynamique',
    color: '#1E4D7A',
    bg: '#EEF4FA',
    description: 'Accepte une volatilité significative pour viser des performances supérieures. Forte exposition actions. Horizon moyen-long terme.'
  },
  offensif: {
    label: 'Profil Offensif',
    color: '#081828',
    bg: '#E8DDD0',
    description: 'Recherche de performance maximale. Accepte des pertes importantes. Exposition élevée aux marchés actions et actifs alternatifs.'
  },
}

export function ProfilRisqueSection() {
  const { bilan, updateProfilRisque, calculations } = useBilan()
  const { profilRisque } = bilan

  const questions = [
    {
      key: 'objectif' as const,
      title: "Quel est l'objectif principal de vos investissements ?",
      choices: [
        { value: 'conservation', label: 'Conservation du capital', description: 'Je veux protéger mon épargne avant tout' },
        { value: 'revenu', label: 'Génération de revenus', description: 'Je souhaite des revenus réguliers' },
        { value: 'croissance', label: 'Croissance à long terme', description: 'Je cherche à faire fructifier mon capital' },
        { value: 'speculation', label: 'Maximisation du rendement', description: "J'accepte des risques élevés pour des gains potentiels importants" },
      ]
    },
    {
      key: 'horizon' as const,
      title: "Quel est votre horizon d'investissement ?",
      choices: [
        { value: 'moins_1an', label: "Moins d'1 an" },
        { value: '1_3ans', label: 'De 1 à 3 ans' },
        { value: '3_5ans', label: 'De 3 à 5 ans' },
        { value: 'plus_5ans', label: 'Plus de 5 ans' },
      ]
    },
    {
      key: 'experience' as const,
      title: "Quelle est votre expérience en matière d'investissement ?",
      choices: [
        { value: 'debutant', label: 'Débutant', description: 'Livrets, épargne de base uniquement' },
        { value: 'intermediaire', label: 'Intermédiaire', description: 'Assurance-vie, fonds, quelques actions' },
        { value: 'experimente', label: 'Expérimenté', description: 'Actions, obligations, SCPI, produits structurés' },
        { value: 'expert', label: 'Expert', description: 'Tous types de produits, marchés dérivés' },
      ]
    },
    {
      key: 'capacitePertes' as const,
      title: "Quelle perte maximale pourriez-vous supporter sans difficulté ?",
      choices: [
        { value: 'zero', label: 'Aucune perte acceptable', description: '0 % de perte' },
        { value: 'dix', label: 'Perte légère', description: "Jusqu'à -10 %" },
        { value: 'vingtcinq', label: 'Perte modérée', description: "Jusqu'à -25 %" },
        { value: 'cinquante', label: 'Perte importante', description: "Jusqu'à -50 % ou plus" },
      ]
    },
    {
      key: 'reactionBaisse' as const,
      title: "Si votre portefeuille perd 20 % en quelques semaines, vous...",
      choices: [
        { value: 'vendre_tout', label: 'Je vends tout immédiatement', description: 'Pour éviter de perdre davantage' },
        { value: 'vendre_partie', label: 'Je vends une partie', description: 'Pour sécuriser une partie du capital' },
        { value: 'ne_rien_faire', label: "J'attends sans agir", description: "En espérant une remontée" },
        { value: 'acheter_plus', label: "J'en profite pour investir davantage", description: 'Le marché est en soldes' },
      ]
    },
  ]

  const allAnswered = questions.every(q => !!profilRisque[q.key])

  const illiquiditeChoices: Array<{ value: ToleranceIlliquidite; label: string }> = [
    { value: 'moins_10', label: 'Moins de 10 %' },
    { value: '10_30', label: '10 à 30 %' },
    { value: '30_60', label: '30 à 60 %' },
    { value: 'plus_60', label: 'Plus de 60 %' },
  ]

  const classificationOptions: Array<{ value: ClassificationClient | ''; label: string }> = [
    { value: '', label: '—' },
    { value: 'non_professionnel', label: 'Client non professionnel' },
    { value: 'professionnel', label: 'Client professionnel' },
    { value: 'contrepartie_eligible', label: 'Contrepartie éligible' },
  ]

  return (
    <div>
      <SectionHeader
        title="Profil de risque (MIF2)"
        subtitle="Questionnaire d'adéquation réglementaire conforme à la directive MIF2"
        icon={<Shield size={18} />}
      />

      <div className="space-y-4">

        {/* Addition 1: Classification client */}
        <Card>
          <div className="flex items-center gap-1 mb-3">
            <p className="text-sm font-medium text-ink-800">Classification client</p>
            <Tooltip content="Défaut : Non professionnel. La requalification en Professionnel nécessite de remplir 2 des 3 critères : portefeuille > 500K€, opérations significatives, expérience professionnelle." />
          </div>
          <select
            value={profilRisque.classificationClient}
            onChange={(e) => updateProfilRisque({ classificationClient: e.target.value as ClassificationClient | '' })}
            className="w-full rounded-xl border border-ink-100 bg-surface-1 px-3 py-2 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-navy-300 transition"
          >
            {classificationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {profilRisque.classificationClient === 'professionnel' && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-ink-600 mb-1">Justification de la requalification</label>
              <textarea
                value={profilRisque.justificationClassification}
                onChange={(e) => updateProfilRisque({ justificationClassification: e.target.value })}
                rows={3}
                placeholder="Précisez les critères remplis justifiant la classification professionnelle..."
                className="w-full rounded-xl border border-ink-100 bg-surface-1 px-3 py-2 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-navy-300 transition resize-none"
              />
            </div>
          )}
        </Card>

        {/* Questions 1–5 */}
        {questions.map((q, i) => (
          <Card key={q.key}>
            <p className="font-medium text-ink-800 mb-4" style={{ fontSize: 13 }}>
              <span className="text-ink-400 mr-2">{i + 1}.</span>
              {q.title}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {q.choices.map((choice) => (
                <ChoiceButton
                  key={choice.value}
                  selected={profilRisque[q.key] === choice.value}
                  onClick={() => updateProfilRisque({ [q.key]: choice.value as never })}
                  label={choice.label}
                  description={'description' in choice ? choice.description : undefined}
                />
              ))}
            </div>
          </Card>
        ))}

        {/* Addition 2: Question 6 — tolérance à l'illiquidité */}
        <Card>
          <div className="flex items-start gap-1 mb-4">
            <p className="font-medium text-ink-800" style={{ fontSize: 13 }}>
              <span className="text-ink-400 mr-2">6.</span>
              Quelle part de votre patrimoine peut être bloquée sans possibilité de sortie immédiate ?
            </p>
            <Tooltip content="Part du patrimoine pouvant être bloquée sans possibilité de sortie immédiate. Ouvre l'accès aux SCPI, private equity, FCPI." />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {illiquiditeChoices.map((choice) => (
              <ChoiceButton
                key={choice.value}
                selected={profilRisque.toleranceIlliquidite === choice.value}
                onClick={() => updateProfilRisque({ toleranceIlliquidite: choice.value })}
                label={choice.label}
              />
            ))}
          </div>
        </Card>

        {allAnswered && profilRisque.resultat && (
          <div
            className="p-5 rounded-xl border-2"
            style={{
              backgroundColor: PROFIL_DESCRIPTIONS[profilRisque.resultat].bg,
              borderColor: PROFIL_DESCRIPTIONS[profilRisque.resultat].color,
            }}
          >
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: PROFIL_DESCRIPTIONS[profilRisque.resultat].color }}>
              Profil déterminé
            </p>
            <p className="font-serif text-xl mb-2" style={{ color: PROFIL_DESCRIPTIONS[profilRisque.resultat].color }}>
              {PROFIL_DESCRIPTIONS[profilRisque.resultat].label}
            </p>
            <p className="text-sm text-ink-600">
              {PROFIL_DESCRIPTIONS[profilRisque.resultat].description}
            </p>
          </div>
        )}

        {/* Addition 3: Situation financière MIF2 confirmée */}
        <Card>
          <div className="mb-4">
            <p className="text-sm font-semibold text-ink-800">Situation financière MIF2 — à confirmer avec le client</p>
            <p className="text-xs text-ink-500 mt-0.5">Données issues des sections Revenus et Actif — ajustez si nécessaire</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Revenu annuel confirmé (€)</label>
              <input
                type="number"
                value={profilRisque.revenuAnnuelConfirme || calculations.revenusFoyerAnnuels}
                onChange={(e) => updateProfilRisque({ revenuAnnuelConfirme: Number(e.target.value) })}
                className="w-full rounded-xl border border-ink-100 bg-surface-1 px-3 py-2 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-navy-300 transition"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Patrimoine financier (€)</label>
              <input
                type="number"
                value={profilRisque.patrimoineFinancierConfirme || calculations.totalActifFinancier}
                onChange={(e) => updateProfilRisque({ patrimoineFinancierConfirme: Number(e.target.value) })}
                className="w-full rounded-xl border border-ink-100 bg-surface-1 px-3 py-2 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-navy-300 transition"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Charges fixes (€/an)</label>
              <input
                type="number"
                value={profilRisque.chargesFixesConfirmees || Math.round(calculations.chargesMensuellesTotales * 12)}
                onChange={(e) => updateProfilRisque({ chargesFixesConfirmees: Number(e.target.value) })}
                className="w-full rounded-xl border border-ink-100 bg-surface-1 px-3 py-2 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-navy-300 transition"
                min={0}
              />
            </div>
          </div>
        </Card>

      </div>
    </div>
  )
}

# Design System — Suite Charlie

Système visuel **partagé par les 3 outils** : Bilan Patrimonial, Screener, Proposition d'Investissement.
Tout choix de police, couleur, espacement et direction esthétique est défini ici. Les 3 apps
doivent rendre des valeurs **identiques** — un CGP qui passe d'un outil à l'autre voit une seule suite.

## Contexte produit
- **Ce que c'est :** suite d'outils pour conseillers en gestion de patrimoine (CGP)
- **Pour qui :** CGP — usage professionnel, parcours Bilan → Screener → Proposition
- **Registre :** conseil patrimonial premium, "chaleur institutionnelle" — sérieux mais humain

## Direction esthétique
- **Direction :** Luxury / Refined — chaleur institutionnelle
- **Décoration :** intentionnelle (grain papier discret sur les surfaces cartes, sinon la typo et l'espace font le travail)
- **Mood :** premium, de confiance, chaleureux. Le CGP est un conseiller personnel, pas une plateforme froide.

## Typographie
- **Display / Titres :** `Instrument Serif` — Georgia, serif (fallback)
- **Texte / UI :** `DM Sans` — system-ui, sans-serif (fallback)
- **Données / Mono :** `JetBrains Mono` — ui-monospace (fallback), `font-variant-numeric: tabular-nums`
- **Chargement :** Google Fonts — `Instrument+Serif:ital@0;1` + `DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,400` + `JetBrains+Mono:wght@400;500`
- Ne jamais utiliser Inter, Geist Mono, DM Serif Display (anciens choix divergents abandonnés).

## Couleurs

### Surfaces & encre
| Token | Hex | Usage |
|---|---|---|
| `bg` | `#FAF6EF` | fond de page (crème chaud) |
| `surface` | `#FFFFFF` | cartes, panneaux |
| `surface-subtle` | `#F5EFE6` | surfaces secondaires, hover discret |
| `border` | `#E8DDD0` | bordures standard |
| `border-mid` | `#D4C5B0` | bordures appuyées |
| `ink` | `#1A1410` | texte principal (near-black chaud) |
| `ink-muted` | `#7A6B5E` | texte secondaire |
| `ink-soft` | `#9A8B7C` | placeholders, texte tertiaire |

### Accent — Sable / Or (couleur de marque)
| Token | Hex | Usage |
|---|---|---|
| `sand` | `#9C7A4E` | accent principal — boutons, liens, surbrillances |
| `sand-hover` | `#7D6140` | état survol |
| `sand-faint` | `#F5EFE6` | fond d'accent discret |

### Navy — couleur structurelle (secondaire)
| Token | Hex | Usage |
|---|---|---|
| `navy-900` | `#0F2844` | sidebar Bilan, en-têtes pleins, data viz |
| `navy-700` | `#163A5E` | variantes |
| `navy-600` | `#1E4D7A` | accents structurels clairs |
| `navy-200` | `#A8C4DE` | bordures/fonds navy clairs |
| `navy-50` | `#EEF4FA` | fond navy très clair |

### Sémantiques
| Rôle | Couleur | Fond discret |
|---|---|---|
| Positif / vert | `#1F4535` | `#E8F0EC` |
| Attention / ambre | `#B45309` | `#FEF3E2` |
| Négatif / rouge | `#B91C1C` | `#FEE8E8` |

## Espacement
- **Unité de base :** 4px
- **Densité :** confortable
- **Échelle :** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approche :** hybride — grille disciplinée pour les formulaires/données, éditorial léger pour les pages d'accueil
- **Rayon de bordure :** sm 6px · md 10px · lg 14px · full 9999px
- **Largeur de contenu max :** ~1100px (formulaires), pleine largeur (tableaux/data)

## Motion
- **Approche :** intentionnelle — entrées discrètes (fadeIn 8px / 200ms), transitions d'état utiles
- **Easing :** entrée `ease-out` · sortie `ease-in` · déplacement `cubic-bezier(0.16,1,0.3,1)`
- **Durée :** micro 50-100ms · court 150-250ms · moyen 250-400ms

## Bandeau de parcours (composant partagé)
`CharlieParcoursHeader` existe en 3 copies (une par app) et doit rendre **un visuel identique** :
fond `surface-subtle`, bordure basse `border`, nom du client en `ink`, pastilles d'étapes
(1 Bilan · 2 Screener · 3 Proposition) — étape franchie en vert sémantique, étape courante en `ink`.

## Journal des décisions
| Date | Décision | Raison |
|------|----------|--------|
| 2026-05-15 | Système unifié "Chaleur institutionnelle" | /design-consultation — alignement visuel des 3 outils. Accent or/sable, navy structurel, polices Instrument Serif + DM Sans + JetBrains Mono. |

import { NextRequest, NextResponse } from 'next/server'

export interface ExtractedClientData {
  civilite?: string
  nom?: string
  prenom?: string
  dateNaissance?: string
  nationalite?: string
  email?: string
  telephone?: string
  adresse?: string
  situationProfessionnelle?: string
  professionDetaille?: string
  statutMarital?: string
  regimeMatrimonial?: string
  revenuImposable?: number
  nombrePartsQF?: number
  salaireNet?: number
  revenusFonciers?: number
  // Meta
  confidence: Record<string, 'high' | 'medium' | 'low'>
  rawText: string
}

// ─── Text extraction helpers ─────────────────────────────────────────────────

function extractText(text: string): ExtractedClientData {
  const conf: Record<string, 'high' | 'medium' | 'low'> = {}

  function find(field: string, patterns: RegExp[], level: 'high' | 'medium' | 'low' = 'high'): string | undefined {
    for (const p of patterns) {
      const m = text.match(p)
      if (m?.[1]?.trim()) {
        conf[field] = level
        return m[1].trim()
      }
    }
    return undefined
  }

  function findNumber(field: string, patterns: RegExp[]): number | undefined {
    for (const p of patterns) {
      const m = text.match(p)
      if (m?.[1]) {
        const n = parseFloat(m[1].replace(/[\s,]/g, '').replace(',', '.'))
        if (!isNaN(n)) {
          conf[field] = 'medium'
          return n
        }
      }
    }
    return undefined
  }

  // ─── Nom / Prénom ─────────────────────────────────────────────────────────
  const civiliteRaw = find('civilite', [
    /\b(M\.\s*|Mme\.?\s*|M\b|Madame|Monsieur)\s+[A-ZÉÀÈÙ]/i,
    /Civilité\s*[:\-]\s*(M\.\s*|Mme\.?\s*|Monsieur|Madame)/i,
  ])

  let civilite: string | undefined
  if (civiliteRaw) {
    const v = civiliteRaw.toLowerCase()
    if (v.startsWith('mme') || v.startsWith('madame')) civilite = 'Mme'
    else if (v.startsWith('m.') || v.startsWith('monsieur') || v === 'm') civilite = 'M.'
    conf['civilite'] = 'high'
  }

  const nom = find('nom', [
    /\bNom\s*(?:de\s*famille\s*)?[:\-]\s*([A-ZÉÀÈÙ][A-ZÉÀÈÙa-zéàèùœ\-\s]{1,40}?)(?:\s*\n|\s{2,}|,)/,
    /\bNOM\s*[:\-]\s*([A-ZÉÀÈÙ][A-Za-zÉÀÈÙéàèùœ\-]{1,30})/,
    /(?:M\.|Mme\.?|Monsieur|Madame)\s+([A-ZÉÀÈÙ][a-zéàèùœ\-]{1,30})\s+([A-ZÉÀÈÙ][A-Za-zÉÀÈÙéàèùœ\-]{1,30})/,
  ])

  const prenom = find('prenom', [
    /\bPrénom\s*[:\-]\s*([A-ZÉÀÈÙ][a-zéàèùœ\-\s]{1,30}?)(?:\s*\n|\s{2,}|,)/,
    /\bPRÉNOM\s*[:\-]\s*([A-ZÉÀÈÙ][a-zéàèùœ\-\s]{1,30})/,
  ])

  // ─── Date de naissance ────────────────────────────────────────────────────
  let dateNaissance = find('dateNaissance', [
    /[Nn]é(?:e)?\s+le\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
    /[Dd]ate\s+de\s+naissance\s*[:\-]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
    /DDN\s*[:\-]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
  ])
  if (dateNaissance) {
    // Normalize to YYYY-MM-DD
    const parts = dateNaissance.split(/[\/\-\.]/)
    if (parts.length === 3) {
      const [d, m, y] = parts
      if (y.length === 4) dateNaissance = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
    }
  }

  // ─── Contact ─────────────────────────────────────────────────────────────
  const emailMatch = text.match(/[\w.\-+]+@[\w.\-]+\.[a-z]{2,}/i)
  const email = emailMatch ? (conf['email'] = 'high', emailMatch[0]) : undefined

  const telMatch = text.match(/(?:\+33|0033|0)[1-9](?:[\s.\-]?\d{2}){4}/)
  const telephone = telMatch ? (conf['telephone'] = 'high', telMatch[0].replace(/[\s.\-]/g, '').replace(/^0033/, '+33').replace(/^00/, '0')) : undefined

  // ─── Adresse ──────────────────────────────────────────────────────────────
  const adresse = find('adresse', [
    /[Aa]dresse\s*[:\-]\s*(.{10,80}?(?:\d{5}\s*[A-ZÉÀÈÙa-zéàèù\s]{2,30}))/,
    /(\d{1,4},?\s+(?:rue|avenue|boulevard|impasse|allée|chemin|place|voie)[^,\n]{5,50},?\s*\d{5}\s*[A-Za-zÉÀÈÙéàèù\s]{2,30})/i,
  ], 'medium')

  // ─── Situation professionnelle ────────────────────────────────────────────
  let situationProfessionnelle: string | undefined
  const proText = text.toLowerCase()
  if (/\b(salarié|employé|cadre)\b/.test(proText)) { situationProfessionnelle = 'salarie'; conf['situationProfessionnelle'] = 'medium' }
  else if (/\b(tns|indépendant|auto[-\s]?entrepreneur|travailleur non salarié)\b/.test(proText)) { situationProfessionnelle = 'tns'; conf['situationProfessionnelle'] = 'medium' }
  else if (/\b(gérant|dirigeant|président|dg|pdg)\b/.test(proText)) { situationProfessionnelle = 'dirigeant'; conf['situationProfessionnelle'] = 'medium' }
  else if (/\b(retraité|retraite|pension)\b/.test(proText)) { situationProfessionnelle = 'retraite'; conf['situationProfessionnelle'] = 'medium' }

  // ─── Situation matrimoniale ───────────────────────────────────────────────
  let statutMarital: string | undefined
  if (/\b(marié|mariée|marie)\b/.test(proText)) { statutMarital = 'marie'; conf['statutMarital'] = 'medium' }
  else if (/\b(pacsé|pacsée|pacs)\b/.test(proText)) { statutMarital = 'pacse'; conf['statutMarital'] = 'medium' }
  else if (/\b(célibataire|celibataire)\b/.test(proText)) { statutMarital = 'celibataire'; conf['statutMarital'] = 'medium' }
  else if (/\b(divorcé|divorcée|divorce)\b/.test(proText)) { statutMarital = 'divorce'; conf['statutMarital'] = 'medium' }
  else if (/\b(veuf|veuve)\b/.test(proText)) { statutMarital = 'veuf'; conf['statutMarital'] = 'medium' }

  // ─── Régime matrimonial ───────────────────────────────────────────────────
  let regimeMatrimonial: string | undefined
  if (/séparation de biens/.test(proText)) { regimeMatrimonial = 'separation_biens'; conf['regimeMatrimonial'] = 'high' }
  else if (/communauté universelle/.test(proText)) { regimeMatrimonial = 'communaute_universelle'; conf['regimeMatrimonial'] = 'high' }
  else if (/participation aux acquêts/.test(proText)) { regimeMatrimonial = 'participation_acquets'; conf['regimeMatrimonial'] = 'high' }
  else if (/communauté légale|régime légal/.test(proText)) { regimeMatrimonial = 'communaute_legale'; conf['regimeMatrimonial'] = 'medium' }

  // ─── Fiscalité ────────────────────────────────────────────────────────────
  const revenuImposable = findNumber('revenuImposable', [
    /revenu(?:s)?\s+(?:net\s+)?imposable(?:s)?\s*[:\-]\s*([\d\s]{4,12})/i,
    /revenu\s+fiscal\s+de\s+référence\s*[:\-]\s*([\d\s]{4,12})/i,
    /RFR\s*[:\-]\s*([\d\s]{4,12})/i,
  ])

  const nombrePartsQF = findNumber('nombrePartsQF', [
    /nombre\s+de\s+parts?\s*[:\-]\s*([\d.,]{1,4})/i,
    /quotient\s+familial[^:]*[:\-]\s*([\d.,]{1,4})/i,
    /(\d(?:[,\.]\d)?)\s+parts?\s+fiscales/i,
  ])

  const salaireNet = findNumber('salaireNet', [
    /salaire\s+net[^:]*[:\-]\s*([\d\s]{4,12})/i,
    /revenu(?:s)?\s+(?:du\s+)?travail[^:]*[:\-]\s*([\d\s]{4,12})/i,
  ])

  const revenusFonciers = findNumber('revenusFonciers', [
    /revenus?\s+fonciers?[^:]*[:\-]\s*([\d\s]{4,12})/i,
    /loyers?\s+(?:perçus?|bruts?)[^:]*[:\-]\s*([\d\s]{4,12})/i,
  ])

  const nationalite = find('nationalite', [
    /nationalité\s*[:\-]\s*([A-ZÉÀÈÙa-zéàèù]{4,20})/i,
  ], 'medium')

  const professionDetaille = find('professionDetaille', [
    /(?:profession|métier|fonction)\s*[:\-]\s*(.{5,50}?)(?:\n|,|\.|;)/i,
    /(?:qualité|titre)\s*[:\-]\s*(.{5,50}?)(?:\n|,|\.|;)/i,
  ], 'medium')

  return {
    civilite,
    nom,
    prenom,
    dateNaissance,
    nationalite,
    email,
    telephone,
    adresse,
    situationProfessionnelle,
    professionDetaille,
    statutMarital,
    regimeMatrimonial,
    revenuImposable,
    nombrePartsQF,
    salaireNet,
    revenusFonciers,
    confidence: conf,
    rawText: text.slice(0, 2000),
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const pastedText = formData.get('text') as string | null

    let text = ''

    if (pastedText && pastedText.trim().length > 10) {
      text = pastedText
    } else if (file) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const mime = file.type || ''

      if (mime === 'application/pdf' || file.name.endsWith('.pdf')) {
        try {
          const pdfParse = (await import('pdf-parse')).default
          const data = await pdfParse(buffer)
          text = data.text
        } catch {
          return NextResponse.json({ error: 'Impossible de lire ce PDF. Essayez de copier-coller le texte.' }, { status: 422 })
        }
      } else if (mime.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        text = buffer.toString('utf-8')
      } else {
        return NextResponse.json({ error: 'Format non supporté. Utilisez PDF, TXT ou collez le texte directement.' }, { status: 422 })
      }
    } else {
      return NextResponse.json({ error: 'Aucun fichier ni texte fourni.' }, { status: 400 })
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'Le document ne contient pas de texte extractible.' }, { status: 422 })
    }

    const extracted = extractText(text)
    return NextResponse.json(extracted)
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

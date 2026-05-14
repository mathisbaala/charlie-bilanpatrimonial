import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { BilanPDF } from '@/components/pdf/BilanPDF'
import { calculateBilan } from '@/lib/calculations'
import type { BilanData, ParametresCabinet } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const bilan: BilanData = body.bilan
    const cabinet: ParametresCabinet = body.cabinet
    const calculations = calculateBilan(bilan)

    const buffer = await renderToBuffer(
      React.createElement(BilanPDF, { bilan, cabinet, calculations })
    )

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Bilan_Patrimonial_${bilan.identite.prenom}_${bilan.identite.nom}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

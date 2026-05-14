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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(BilanPDF as any, { bilan, cabinet, calculations })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any)

    return new NextResponse(buffer as unknown as BodyInit, {
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

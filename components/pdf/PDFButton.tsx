'use client'

import dynamic from 'next/dynamic'

export const PDFButton = dynamic(
  () => import('./PDFButtonInner').then((mod) => mod.PDFButtonInner),
  { ssr: false, loading: () => null }
)

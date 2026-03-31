import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'baro-dap | AI 민원처리 시스템',
  description: 'AI 기반 민원 접수 및 처리 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}

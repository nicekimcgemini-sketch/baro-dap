import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'baro-dap | AI 민원처리 시스템',
  description: 'AI 기반 민원 접수 및 처리 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web" />
      </head>
      <body className="feather-bg min-h-screen text-spring-text">{children}</body>
    </html>
  )
}

import ComplaintForm from '@/components/ComplaintForm'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-spring-soft">
      <header className="spring-gradient px-6 py-4 flex items-center justify-between shadow-md">
        <h1 className="text-2xl font-bold text-white tracking-wide drop-shadow">🦜 baro-dap</h1>
        <Link href="/login" className="text-white/80 hover:text-white text-sm transition">
          관리자/상담원 로그인
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-spring-text mb-3">
            🌸 민원 접수
          </h2>
          <p className="text-spring-text-light">
            불편하신 사항을 접수해 주시면 AI가 분석하여 담당자가 빠르게 처리해드립니다.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-spring-pink-border p-8">
          <ComplaintForm />
        </div>
      </main>
    </div>
  )
}

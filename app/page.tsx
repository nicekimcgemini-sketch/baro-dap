import ComplaintForm from '@/components/ComplaintForm'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600">baro-dap</h1>
        <Link href="/login" className="text-sm text-gray-500 hover:text-blue-600">
          관리자/상담원 로그인
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">민원 접수</h2>
          <p className="text-gray-500">
            불편하신 사항을 접수해 주시면 AI가 분석하여 담당자가 빠르게 처리해드립니다.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <ComplaintForm />
        </div>
      </main>
    </div>
  )
}

import Navbar from '@/components/Navbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 py-4">{children}</main>
    </div>
  )
}

import Navbar from '@/components/Navbar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar section="admin" />
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

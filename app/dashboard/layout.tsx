import Navbar from '@/components/Navbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-spring-soft">
      <Navbar />
      <main id="main-content" className="max-w-6xl mx-auto px-3 sm:px-6 py-4">{children}</main>
    </div>
  )
}

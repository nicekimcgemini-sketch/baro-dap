import StaffTable from '@/components/StaffTable'
import { Staff } from '@/lib/types'

async function getStaff(): Promise<Staff[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/staff`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function StaffPage() {
  const staff = await getStaff()

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">담당자 관리</h1>
      <StaffTable initialStaff={staff} />
    </div>
  )
}

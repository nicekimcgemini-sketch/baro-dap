import ComplaintDetail from '@/components/ComplaintDetail'
import { Complaint } from '@/lib/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getComplaint(id: string): Promise<Complaint> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/complaints/${id}`, { cache: 'no-store' })
  if (!res.ok) notFound()
  return res.json()
}

export default async function CounselDetailPage({ params }: { params: { id: string } }) {
  const complaint = await getComplaint(params.id)

  return (
    <div>
      <div className="mb-5">
        <Link href="/counsel" className="text-sm text-blue-500 hover:underline">
          ← 민원 목록
        </Link>
      </div>
      <ComplaintDetail complaint={complaint} />
    </div>
  )
}

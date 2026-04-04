export type Priority = 1 | 2 | 3 | 4 | 5

export const PRIORITY_EMOJI: Record<Priority, string> = {
  1: '😁',
  2: '🙂',
  3: '😒',
  4: '😤',
  5: '😡',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  1: '매우 만족',
  2: '보통',
  3: '불만',
  4: '화남',
  5: '매우 화남',
}

export type ComplaintStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  pending: '접수',
  in_progress: '처리중',
  resolved: '완료',
  closed: '종료',
}

export type StaffRole = 'counselor' | 'admin'

export interface Staff {
  id: string
  name: string
  department: string
  role: StaffRole
  email: string
  specialties: string[]
  is_active: boolean
  created_at: string
}

export interface Complaint {
  id: string
  title: string
  content: string
  customer_name: string
  customer_contact: string
  status: ComplaintStatus
  priority: Priority | null
  category: string | null
  ai_response: string | null
  ai_analysis: AiAnalysis | null
  assigned_staff_id: string | null
  assigned_staff?: Staff
  created_by_staff_id: string | null
  final_response: string | null
  created_at: string
  updated_at: string
}

export interface AiAnalysis {
  priority: Priority
  category: string
  department: string
  ai_response: string
  reasoning: string
}

export interface CreateComplaintInput {
  title: string
  content: string
  counselor_name: string
  created_by_staff_id?: string
}

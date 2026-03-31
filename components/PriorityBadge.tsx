import { Priority, PRIORITY_EMOJI, PRIORITY_LABEL } from '@/lib/types'

interface Props {
  priority: Priority | null
  showLabel?: boolean
}

export default function PriorityBadge({ priority, showLabel = false }: Props) {
  if (!priority) return <span className="text-gray-400 text-sm">분석 중</span>

  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-lg">{PRIORITY_EMOJI[priority]}</span>
      {showLabel && (
        <span className="text-sm text-gray-600">{PRIORITY_LABEL[priority]}</span>
      )}
    </span>
  )
}

import type { VideoEditModeBadgeProps } from '../../types'
import { Video } from 'lucide-react'

export function VideoEditModeBadge({ label }: VideoEditModeBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800">
      <Video className="h-3 w-3" />
      {label}
    </span>
  )
}

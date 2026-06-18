import type { ToolbarLinksProps } from '../../types'
import { ExternalLink } from 'lucide-react'

export function ToolbarLinks({
  isVideoMode,
  promptsExploreLabel,
  promptsExploreUrl,
}: ToolbarLinksProps) {
  if (!isVideoMode) {
    return null
  }

  return (
    <a
      href={promptsExploreUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      {promptsExploreLabel}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

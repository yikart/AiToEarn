import type { MoreOptionsToggleProps } from '../../types'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/utils/className'
import { pillClass } from '../../utils/styles'

export function MoreOptionsToggle({ label, open, onOpenChange }: MoreOptionsToggleProps) {
  return (
    <button
      type="button"
      className={cn(
        pillClass,
        open && 'bg-primary/10 text-foreground border-primary/20',
      )}
      onClick={() => onOpenChange(!open)}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

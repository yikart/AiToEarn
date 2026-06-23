import type { DurationSelectProps } from '../../types'
import { Clock, Lock } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/className'
import { pillClass } from '../../utils/styles'

export function DurationSelect({
  draftDuration,
  duration,
  inputVideoDuration,
  isVideoEditMode,
  label,
  lockedByVideoLabel,
  popover,
  videoDurationLimits,
  onDurationCommit,
  onDurationDraftChange,
}: DurationSelectProps) {
  if (isVideoEditMode && inputVideoDuration !== null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className={cn(pillClass, 'opacity-50 pointer-events-none')}>
              <Lock className="h-3 w-3" />
              <Clock className="h-3.5 w-3.5" />
              <span className="tabular-nums">{`${duration}s`}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>{lockedByVideoLabel}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (videoDurationLimits.min === videoDurationLimits.max) {
    return (
      <span className={cn(pillClass, 'opacity-50 pointer-events-none')}>
        <Lock className="h-3 w-3" />
        <Clock className="h-3.5 w-3.5" />
        <span className="tabular-nums">{`${duration}s`}</span>
      </span>
    )
  }

  return (
    <Popover open={popover.open} onOpenChange={popover.onOpenChange}>
      <PopoverTrigger asChild>
        <button data-testid="draftbox-ai-duration" type="button" className={pillClass}>
          <Clock className="h-3.5 w-3.5" />
          <span className="tabular-nums">{`${draftDuration ?? duration}s`}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" side="top" align="start">
        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground">{label}</span>
          <div className="flex items-center gap-2">
            <Slider
              value={[draftDuration ?? duration]}
              onValueChange={onDurationDraftChange}
              onValueCommit={onDurationCommit}
              min={videoDurationLimits.min}
              max={videoDurationLimits.max}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-6 text-right">
              {`${draftDuration ?? duration}s`}
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

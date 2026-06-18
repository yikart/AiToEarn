import type { AspectRatioSelectProps } from '../../types'
import { Grid2x2, Lock } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/className'
import { pillClass } from '../../utils/styles'

export function AspectRatioSelect({
  aspectRatio,
  isLocked,
  label,
  lockedLabel,
  popover,
  supportedRatios,
  onAspectRatioChange,
}: AspectRatioSelectProps) {
  if (isLocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className={cn(pillClass, 'opacity-50 pointer-events-none')}>
              <Lock className="h-3 w-3" />
              <Grid2x2 className="h-3.5 w-3.5" />
              {aspectRatio}
            </button>
          </TooltipTrigger>
          <TooltipContent>{lockedLabel}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Popover open={popover.open} onOpenChange={popover.onOpenChange}>
      <PopoverTrigger asChild>
        <button data-testid="draftbox-ai-ratio" type="button" className={pillClass}>
          <Grid2x2 className="h-3.5 w-3.5" />
          {aspectRatio}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top" align="start">
        <span className="text-xs font-medium text-foreground mb-2 block">{label}</span>
        <div className="flex gap-1">
          {supportedRatios.map(({ label, w, h }) => {
            const isActive = label === aspectRatio
            return (
              <button
                key={label}
                type="button"
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-10 py-1.5 rounded-md cursor-pointer transition-colors',
                  isActive
                    ? 'bg-primary/10 text-foreground'
                    : 'hover:bg-muted text-muted-foreground',
                )}
                onClick={() => onAspectRatioChange(label)}
              >
                <span className="flex items-center justify-center h-5">
                  <span
                    className={cn(
                      'rounded-sm',
                      isActive
                        ? 'border-[1.5px] border-primary'
                        : 'border-[1.5px] border-muted-foreground/40',
                    )}
                    style={{ width: w, height: h }}
                  />
                </span>
                <span className="text-[10px] leading-none">{label}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

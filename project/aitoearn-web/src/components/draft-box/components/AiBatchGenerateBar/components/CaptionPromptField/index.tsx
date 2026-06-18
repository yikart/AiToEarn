'use client'

import { CircleHelp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/className'

interface CaptionPromptFieldProps {
  compactBottomPadding: boolean
  label: string
  tip: string
  placeholder: string
  value: string
  maxLength: number
  onChange: (value: string) => void
}

export function CaptionPromptField({
  compactBottomPadding,
  label,
  tip,
  placeholder,
  value,
  maxLength,
  onChange,
}: CaptionPromptFieldProps) {
  return (
    <div className={cn('px-4', compactBottomPadding ? 'pb-7' : 'pb-3')}>
      <div className="flex flex-col gap-2 @min-[640px]:flex-row @min-[640px]:items-center">
        <div className="flex shrink-0 items-center gap-1 text-xs font-normal text-muted-foreground/65 @min-[640px]:w-16">
          <span>{label}</span>
          <TooltipProvider delayDuration={120}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={label}
                  className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <CircleHelp className="h-2.5 w-2.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-64 text-xs leading-5">
                {tip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          className="h-6 rounded-none border-x-0 border-t-0 border-b border-dashed border-border/40 bg-transparent px-0 py-0 text-xs leading-none text-muted-foreground/80 shadow-none focus-visible:border-muted-foreground/70 focus-visible:text-foreground focus-visible:ring-0 md:text-xs"
          placeholder={placeholder}
          value={value}
          onChange={event => onChange(event.target.value)}
          maxLength={maxLength}
        />
      </div>
    </div>
  )
}

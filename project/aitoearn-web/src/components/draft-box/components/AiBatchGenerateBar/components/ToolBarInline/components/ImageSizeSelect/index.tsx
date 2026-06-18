import type { ImageSizeSelectProps } from '../../types'
import { Ruler } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utils/className'
import { pillClass } from '../../utils/styles'

export function ImageSizeSelect({
  imagePricing,
  imageSize,
  label,
  popover,
  onImageSizeChange,
}: ImageSizeSelectProps) {
  return (
    <Popover open={popover.open} onOpenChange={popover.onOpenChange}>
      <PopoverTrigger asChild>
        <button data-testid="draftbox-ai-resolution" type="button" className={pillClass}>
          <Ruler className="h-3.5 w-3.5" />
          {imageSize}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top" align="start">
        <span className="text-xs font-medium text-foreground mb-2 block">{label}</span>
        <div className="flex flex-col gap-1">
          {imagePricing.map(({ resolution }) => (
            <button
              key={resolution}
              type="button"
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-xs cursor-pointer transition-colors text-left',
                resolution === imageSize
                  ? 'bg-primary/10 text-foreground font-medium'
                  : 'hover:bg-muted text-muted-foreground',
              )}
              onClick={() => onImageSizeChange(resolution)}
            >
              {resolution}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

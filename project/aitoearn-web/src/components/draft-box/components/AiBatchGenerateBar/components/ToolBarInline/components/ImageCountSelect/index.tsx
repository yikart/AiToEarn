import type { ImageCountSelectProps } from '../../types'
import { Image } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { IMAGE_COUNT_LIMITS } from '../../../../utils/constants'
import { pillClass } from '../../utils/styles'

export function ImageCountSelect({
  imageCount,
  label,
  popover,
  onImageCountChange,
}: ImageCountSelectProps) {
  return (
    <Popover open={popover.open} onOpenChange={popover.onOpenChange}>
      <PopoverTrigger asChild>
        <button data-testid="draftbox-ai-image-count" type="button" className={pillClass}>
          <Image className="h-3.5 w-3.5" />
          x
          {imageCount}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" side="top" align="start">
        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground">{label}</span>
          <div className="flex items-center gap-2">
            <Slider
              value={[imageCount]}
              onValueChange={onImageCountChange}
              min={IMAGE_COUNT_LIMITS.min}
              max={IMAGE_COUNT_LIMITS.max}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-6 text-right">{imageCount}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

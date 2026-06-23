import type { QuantitySelectProps } from '../../types'
import { Layers } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { pillClass } from '../../utils/styles'

export function QuantitySelect({ label, popover, quantity, onQuantityChange }: QuantitySelectProps) {
  return (
    <Popover open={popover.open} onOpenChange={popover.onOpenChange}>
      <PopoverTrigger asChild>
        <button data-testid="draftbox-ai-quantity" type="button" className={pillClass}>
          <Layers className="h-3.5 w-3.5" />
          x
          {quantity}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" side="top" align="start">
        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground">{label}</span>
          <div className="flex items-center gap-2">
            <Slider
              value={[quantity]}
              onValueChange={onQuantityChange}
              min={1}
              max={10}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-6 text-right">{quantity}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

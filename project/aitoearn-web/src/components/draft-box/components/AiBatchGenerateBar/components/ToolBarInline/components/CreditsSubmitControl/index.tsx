import type { CreditsSubmitControlProps } from '../../types'
import { ArrowUp, Loader2 } from 'lucide-react'
import { cn } from '@/utils/className'

export function CreditsSubmitControl({
  isLoading,
  onSubmit,
}: CreditsSubmitControlProps) {
  return (
    <button
      data-testid="draftbox-ai-submit-btn"
      type="button"
      className={cn(
        'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90',
        isLoading && 'pointer-events-none opacity-60',
      )}
      disabled={isLoading}
      onClick={onSubmit}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowUp className="h-4 w-4" />
      )}
    </button>
  )
}

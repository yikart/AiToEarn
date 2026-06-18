import type { UploadProgressOverlayProps } from '../../types'
import { Loader2 } from 'lucide-react'

export function UploadProgressOverlay({ progress }: UploadProgressOverlayProps) {
  return (
    <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-md">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      {typeof progress === 'number' && progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden rounded-b-md">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

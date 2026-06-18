import type { GenerationModeSelectProps } from '../../types'
import { FileText, Image, Video } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/utils/className'
import { pillClass } from '../../utils/styles'

export function GenerationModeSelect({
  contentType,
  hideNonDraftModes,
  isDraftMode,
  isVideoMode,
  labels,
  popover,
  onContentTypeChange,
  onDraftModeChange,
}: GenerationModeSelectProps) {
  const currentLabel = isDraftMode
    ? `${labels.draftModeOn}(${isVideoMode ? labels.contentTypeVideo : labels.contentTypeImageText})`
    : isVideoMode
      ? labels.draftModeOffVideo
      : labels.draftModeOffImage

  return (
    <Popover open={popover.open} onOpenChange={popover.onOpenChange}>
      <PopoverTrigger asChild>
        <button data-testid="draftbox-ai-gen-mode" type="button" className={pillClass}>
          {isDraftMode ? (
            <FileText className="h-3.5 w-3.5" />
          ) : isVideoMode ? (
            <Video className="h-3.5 w-3.5" />
          ) : (
            <Image className="h-3.5 w-3.5" />
          )}
          {currentLabel}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="top" align="start">
        <div className="flex flex-col gap-1">
          {[
            {
              key: 'draft_image',
              label: `${labels.draftModeOn}(${labels.contentTypeImageText})`,
              icon: FileText,
              isDraft: true,
              contentType: 'image_text' as const,
            },
            {
              key: 'draft_video',
              label: `${labels.draftModeOn}(${labels.contentTypeVideo})`,
              icon: FileText,
              isDraft: true,
              contentType: 'video' as const,
            },
          ].map(({ key, label, icon: Icon, contentType: nextContentType }) => {
            const isActive = isDraftMode && contentType === nextContentType
            return (
              <button
                key={key}
                type="button"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-xs cursor-pointer transition-colors text-left',
                  isActive
                    ? 'bg-primary/10 text-foreground font-medium'
                    : 'hover:bg-muted text-muted-foreground',
                )}
                onClick={() => {
                  onDraftModeChange(true)
                  if (contentType !== nextContentType)
                    onContentTypeChange(nextContentType)
                  popover.onOpenChange(false)
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            )
          })}
          {!hideNonDraftModes && (
            <>
              <div className="border-t border-border my-1" />
              {[
                {
                  key: 'image',
                  label: labels.draftModeOffImage,
                  icon: Image,
                  contentType: 'image_text' as const,
                },
                {
                  key: 'video',
                  label: labels.draftModeOffVideo,
                  icon: Video,
                  contentType: 'video' as const,
                },
              ].map(({ key, label, icon: Icon, contentType: nextContentType }) => {
                const isActive = !isDraftMode && contentType === nextContentType
                return (
                  <button
                    key={key}
                    type="button"
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-xs cursor-pointer transition-colors text-left',
                      isActive
                        ? 'bg-primary/10 text-foreground font-medium'
                        : 'hover:bg-muted text-muted-foreground',
                    )}
                    onClick={() => {
                      onDraftModeChange(false)
                      if (contentType !== nextContentType)
                        onContentTypeChange(nextContentType)
                      popover.onOpenChange(false)
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                )
              })}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

'use client'

import type { ChangeEvent, RefObject } from 'react'
import type { MediaMentionItem } from '../MediaMentionPromptInput'
import type { IUploadedMedia } from '@/components/Chat/MediaUpload'
import { Maximize2, RotateCcw, X } from 'lucide-react'
import ImageStack from '../ImageStack'
import MediaMentionPromptInput from '../MediaMentionPromptInput'

interface PromptComposerLabels {
  missingMedia: string
  emptyMedia: string
  emptyMediaHint: string
  loading: string
  uploadMedia: string
  resetConfig: string
  openPromptEditor: string
}

interface PromptComposerProps {
  uploadInputRef: RefObject<HTMLInputElement>
  mediaAccept: string
  localMedias: IUploadedMedia[]
  canUploadImage: boolean
  canUploadVideo: boolean
  canUploadAudio: boolean
  promptValue: string
  placeholder: string
  maxLength: number
  mediaMentions: MediaMentionItem[]
  labels: PromptComposerLabels
  onUploadInputChange: (event: ChangeEvent<HTMLInputElement>) => void
  onLocalMediaRemove: (index: number) => void
  onLocalUpload: (files: FileList) => void
  onPromptChange: (value: string) => void
  onPasteFiles: (files: FileList) => void
  onRequestUpload: () => void
  onReset: () => void
  onOpenPromptEditor: () => void
  onClear: () => void
}

export function PromptComposer({
  uploadInputRef,
  mediaAccept,
  localMedias,
  canUploadImage,
  canUploadVideo,
  canUploadAudio,
  promptValue,
  placeholder,
  maxLength,
  mediaMentions,
  labels,
  onUploadInputChange,
  onLocalMediaRemove,
  onLocalUpload,
  onPromptChange,
  onPasteFiles,
  onRequestUpload,
  onReset,
  onOpenPromptEditor,
  onClear,
}: PromptComposerProps) {
  return (
    <>
      <input
        ref={uploadInputRef}
        type="file"
        accept={mediaAccept}
        multiple
        className="hidden"
        onChange={onUploadInputChange}
      />

      <div className="flex flex-col items-stretch gap-3 p-4 pb-2 @min-[640px]:flex-row @min-[640px]:items-start">
        <div className="w-full shrink-0 pt-1 @min-[640px]:w-auto">
          <ImageStack
            localMedias={localMedias}
            onLocalMediaRemove={onLocalMediaRemove}
            onLocalUpload={onLocalUpload}
            canUploadImage={canUploadImage}
            canUploadVideo={canUploadVideo}
            canUploadAudio={canUploadAudio}
            accept={mediaAccept}
          />
        </div>
        <div className="relative w-full @min-[640px]:min-w-0 @min-[640px]:flex-1">
          <MediaMentionPromptInput
            testId="draftbox-ai-prompt-input"
            value={promptValue}
            placeholder={placeholder}
            maxLength={maxLength}
            mediaMentions={mediaMentions}
            onChange={onPromptChange}
            onPasteFiles={onPasteFiles}
            onRequestUpload={onRequestUpload}
            missingMediaLabel={labels.missingMedia}
            emptyMediaLabel={labels.emptyMedia}
            emptyMediaHintLabel={labels.emptyMediaHint}
            loadingLabel={labels.loading}
            uploadMediaLabel={labels.uploadMedia}
            editorClassName="min-h-[80px] max-h-[160px] overflow-auto pr-12 text-sm @min-[640px]:min-h-[100px]"
            placeholderClassName="pr-12 text-sm"
            minRows={3}
          />
          <div className="absolute top-0 right-4 z-10 flex flex-col items-center gap-0.5">
            <button
              data-testid="draftbox-ai-reset-btn"
              type="button"
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              onClick={onReset}
              title={labels.resetConfig}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              data-testid="draftbox-ai-open-prompt-editor-btn"
              type="button"
              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              onClick={onOpenPromptEditor}
              title={labels.openPromptEditor}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            {promptValue && (
              <button
                data-testid="draftbox-ai-clear-btn"
                type="button"
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                onClick={onClear}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

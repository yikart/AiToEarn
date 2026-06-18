/**
 * AiBatchGenerateBar
 */

'use client'

import type { AiBatchGenerateBarProps } from './types'
import { memo } from 'react'
import { CaptionPromptField } from './components/CaptionPromptField'
import { DragUploadOverlay } from './components/DragUploadOverlay'
import { PromptComposer } from './components/PromptComposer'
import PromptEditorDialog from './components/PromptEditorDialog'
import ToolBarInline from './components/ToolBarInline'
import { useAiBatchGenerateBarController } from './hooks/useAiBatchGenerateBarController'

const AiBatchGenerateBar = memo((props: AiBatchGenerateBarProps) => {
  const {
    containerProps,
    promptComposerProps,
    toolBarProps,
    captionPromptFieldProps,
    promptEditorDialogProps,
    dragUploadOverlayLabel,
  } = useAiBatchGenerateBarController(props)

  return (
    <div {...containerProps}>
      <PromptComposer {...promptComposerProps} />

      <div className="px-4 pb-3 pt-0">
        <ToolBarInline {...toolBarProps} />
      </div>

      {captionPromptFieldProps && <CaptionPromptField {...captionPromptFieldProps} />}

      {promptEditorDialogProps && <PromptEditorDialog {...promptEditorDialogProps} />}

      {dragUploadOverlayLabel && <DragUploadOverlay label={dragUploadOverlayLabel} />}
    </div>
  )
})

AiBatchGenerateBar.displayName = 'AiBatchGenerateBar'

export default AiBatchGenerateBar

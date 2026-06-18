import type { EditorState, LexicalEditor } from 'lexical'
import type {
  MediaMentionContextValue,
  UseMediaMentionPromptInputStateParams,
  UseMediaMentionPromptInputStateResult,
} from '../types'
import type { MediaPreviewItem } from '@/components/common/MediaPreview'
import { $getRoot } from 'lexical'
import { useCallback, useMemo, useRef, useState } from 'react'
import { buildMediaMentionItems, mediaMentionMatchesQuery } from '../utils/mentionItems'

export function useMediaMentionPromptInputState({
  mediaMentions,
  missingMediaLabel,
  emptyMediaLabel,
  emptyMediaHintLabel,
  loadingLabel,
  uploadMediaLabel,
  onChange,
  onRequestUpload,
}: UseMediaMentionPromptInputStateParams): UseMediaMentionPromptInputStateResult {
  const lastOutputValueRef = useRef('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewItems, setPreviewItems] = useState<MediaPreviewItem[]>([])

  const mentionItems = useMemo(() => buildMediaMentionItems(mediaMentions), [mediaMentions])
  const itemsByValue = useMemo(() => {
    return new Map(mediaMentions.map(item => [item.value, item]))
  }, [mediaMentions])

  const handleSearch = useCallback(
    (_trigger: string, queryString?: string | null) => {
      if (mediaMentions.length === 0)
        return Promise.resolve(mentionItems)

      const query = queryString ?? ''
      return Promise.resolve(
        buildMediaMentionItems(
          mediaMentions.filter(item => mediaMentionMatchesQuery(item, query)),
        ),
      )
    },
    [mediaMentions, mentionItems],
  )

  const handlePreview = useCallback(
    (mentionValue: string) => {
      const item = itemsByValue.get(mentionValue)
      if (!item)
        return
      setPreviewItems([
        { type: item.type, src: item.src, title: item.previewTitle ?? item.displayName },
      ])
      setPreviewOpen(true)
    },
    [itemsByValue],
  )

  const contextValue = useMemo<MediaMentionContextValue>(
    () => ({
      itemsByValue,
      missingMediaLabel,
      emptyMediaLabel,
      emptyMediaHintLabel,
      loadingLabel,
      uploadMediaLabel,
      onPreview: handlePreview,
      onRequestUpload,
    }),
    [
      emptyMediaHintLabel,
      emptyMediaLabel,
      handlePreview,
      itemsByValue,
      loadingLabel,
      missingMediaLabel,
      onRequestUpload,
      uploadMediaLabel,
    ],
  )

  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      if (editor.isComposing())
        return

      editorState.read(() => {
        const text = $getRoot().getTextContent()
        lastOutputValueRef.current = text
        onChange(text)
      })
    },
    [onChange],
  )

  return {
    lastOutputValueRef,
    previewOpen,
    setPreviewOpen,
    previewItems,
    mentionItems,
    itemsByValue,
    contextValue,
    handleSearch,
    handleChange,
  }
}

import type { EditorState, LexicalEditor } from 'lexical'
import type { BeautifulMentionsItemData } from 'lexical-beautiful-mentions'
import type { MutableRefObject } from 'react'

export type MediaMentionType = 'image' | 'video' | 'audio'

export interface MediaMentionItem {
  value: string
  token: string
  type: MediaMentionType
  src: string
  file?: File
  displayName: string
  typeLabel: string
  previewTitle?: string
}

export interface MediaMentionPromptInputProps {
  value: string
  placeholder: string
  maxLength: number
  mediaMentions: MediaMentionItem[]
  className?: string
  editorClassName?: string
  placeholderClassName?: string
  autoFocus?: boolean
  minRows?: number
  missingMediaLabel: string
  emptyMediaLabel: string
  emptyMediaHintLabel: string
  loadingLabel: string
  uploadMediaLabel: string
  onChange: (value: string) => void
  onPasteFiles?: (files: FileList) => void
  onRequestUpload?: () => void
  testId?: string
}

export interface MediaMentionContextValue {
  itemsByValue: Map<string, MediaMentionItem>
  missingMediaLabel: string
  emptyMediaLabel: string
  emptyMediaHintLabel: string
  loadingLabel: string
  uploadMediaLabel: string
  onPreview: (value: string) => void
  onRequestUpload?: () => void
}

export type MediaMentionNodeData = Record<string, BeautifulMentionsItemData>

export interface InitialValuePluginProps {
  value: string
  itemsByValue: Map<string, MediaMentionItem>
  lastOutputValueRef: MutableRefObject<string>
}

export interface MaxLengthPluginProps {
  maxLength: number
  itemsByValue: Map<string, MediaMentionItem>
  lastOutputValueRef: MutableRefObject<string>
  onChange: (value: string) => void
}

export interface CompositionSyncPluginProps {
  onChange: (value: string) => void
  lastOutputValueRef: MutableRefObject<string>
}

export interface PasteMediaMentionPluginProps {
  itemsByValue: Map<string, MediaMentionItem>
  onPasteFiles?: (files: FileList) => void
}

export interface UseMediaMentionPromptInputStateParams {
  mediaMentions: MediaMentionItem[]
  missingMediaLabel: string
  emptyMediaLabel: string
  emptyMediaHintLabel: string
  loadingLabel: string
  uploadMediaLabel: string
  onChange: (value: string) => void
  onRequestUpload?: () => void
}

export interface UseMediaMentionPromptInputStateResult {
  lastOutputValueRef: MutableRefObject<string>
  previewOpen: boolean
  setPreviewOpen: (open: boolean) => void
  previewItems: import('@/components/common/MediaPreview').MediaPreviewItem[]
  mentionItems: import('lexical-beautiful-mentions').BeautifulMentionsItem[]
  itemsByValue: Map<string, MediaMentionItem>
  contextValue: MediaMentionContextValue
  handleSearch: (
    trigger: string,
    queryString?: string | null,
  ) => Promise<import('lexical-beautiful-mentions').BeautifulMentionsItem[]>
  handleChange: (editorState: EditorState, editor: LexicalEditor) => void
}

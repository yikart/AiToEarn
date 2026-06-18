/**
 * MediaMentionPromptInput - 支持 @ 媒体提及的提示词输入框
 * 用于在提示词中引用当前已上传的图片、视频和音频素材。
 */

'use client'

import type { CSSProperties } from 'react'
import type { MediaMentionPromptInputProps } from './types'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { BeautifulMentionsPlugin } from 'lexical-beautiful-mentions'
import { memo } from 'react'
import { MediaPreview } from '@/components/common/MediaPreview'
import { cn } from '@/utils/className'
import { EmptyMediaMentionMenu } from './components/EmptyMediaMentionMenu'
import { MediaMentionMenu } from './components/MediaMentionMenu'
import { MediaMentionMenuItem } from './components/MediaMentionMenuItem'
import { MediaMentionContext } from './context/MediaMentionContext'
import { useMediaMentionPromptInputState } from './hooks/useMediaMentionPromptInputState'
import styles from './MediaMentionPromptInput.module.scss'
import { CompositionSyncPlugin } from './plugins/CompositionSyncPlugin'
import { EmptyMediaMentionActionGuardPlugin } from './plugins/EmptyMediaMentionActionGuardPlugin'
import { InitialValuePlugin } from './plugins/InitialValuePlugin'
import { MaxLengthPlugin } from './plugins/MaxLengthPlugin'
import { PasteMediaMentionPlugin } from './plugins/PasteMediaMentionPlugin'
import { editorConfig } from './utils/editorConfig'

export type { MediaMentionItem, MediaMentionPromptInputProps, MediaMentionType } from './types'

const MediaMentionPromptInput = memo(
  ({
    value,
    placeholder,
    maxLength,
    mediaMentions,
    className,
    editorClassName,
    placeholderClassName,
    autoFocus = false,
    minRows = 3,
    missingMediaLabel,
    emptyMediaLabel,
    emptyMediaHintLabel,
    loadingLabel,
    uploadMediaLabel,
    onChange,
    onPasteFiles,
    onRequestUpload,
    testId = 'draftbox-ai-prompt-mention-input',
  }: MediaMentionPromptInputProps) => {
    const {
      lastOutputValueRef,
      previewOpen,
      setPreviewOpen,
      previewItems,
      itemsByValue,
      contextValue,
      handleSearch,
      handleChange,
    } = useMediaMentionPromptInputState({
      mediaMentions,
      missingMediaLabel,
      emptyMediaLabel,
      emptyMediaHintLabel,
      loadingLabel,
      uploadMediaLabel,
      onChange,
      onRequestUpload,
    })

    return (
      <MediaMentionContext.Provider value={contextValue}>
        <div
          className={cn(styles.root, className)}
          style={{ '--media-mention-min-rows': minRows } as CSSProperties}
        >
          <LexicalComposer initialConfig={editorConfig}>
            <RichTextPlugin
              contentEditable={(
                <ContentEditable
                  data-testid={testId}
                  className={cn(styles.editorContent, editorClassName)}
                  style={{ tabSize: 1 }}
                />
              )}
              placeholder={
                <div className={cn(styles.placeholder, placeholderClassName)}>{placeholder}</div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={handleChange} />
            <HistoryPlugin />
            {autoFocus && <AutoFocusPlugin defaultSelection="rootEnd" />}
            <InitialValuePlugin
              value={value}
              itemsByValue={itemsByValue}
              lastOutputValueRef={lastOutputValueRef}
            />
            <CompositionSyncPlugin onChange={onChange} lastOutputValueRef={lastOutputValueRef} />
            <MaxLengthPlugin
              maxLength={maxLength}
              itemsByValue={itemsByValue}
              lastOutputValueRef={lastOutputValueRef}
              onChange={onChange}
            />
            <PasteMediaMentionPlugin itemsByValue={itemsByValue} onPasteFiles={onPasteFiles} />
            {mediaMentions.length === 0 && <EmptyMediaMentionActionGuardPlugin />}
            <BeautifulMentionsPlugin
              triggers={['@']}
              onSearch={handleSearch}
              searchDelay={0}
              preTriggerChars="."
              autoSpace
              allowSpaces={false}
              showCurrentMentionsAsSuggestions={false}
              insertOnBlur={false}
              menuItemLimit={15}
              menuComponent={MediaMentionMenu}
              menuItemComponent={MediaMentionMenuItem}
              emptyComponent={EmptyMediaMentionMenu}
            />
          </LexicalComposer>
        </div>
        <MediaPreview
          open={previewOpen}
          items={previewItems}
          onClose={() => setPreviewOpen(false)}
        />
      </MediaMentionContext.Provider>
    )
  },
)

MediaMentionPromptInput.displayName = 'MediaMentionPromptInput'

export default MediaMentionPromptInput

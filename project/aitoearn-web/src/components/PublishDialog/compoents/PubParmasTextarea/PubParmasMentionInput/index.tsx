'use client'

/**
 * PubParmasMentionInput - 带 @ 提及功能的文本输入组件
 * 基于 Lexical 编辑器实现
 */
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import type { EditorState, LexicalEditor } from 'lexical'
import type { ForwardedRef } from 'react'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { $getRoot } from 'lexical'
import {
  BeautifulMentionNode,
  BeautifulMentionsPlugin,
  PlaceholderNode,
} from 'lexical-beautiful-mentions'
import React, { forwardRef, memo, useCallback, useRef } from 'react'

import {
  Menu,
  MenuItem,
} from '@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasMentionInput/components/Menu'

import {
  InitialValuePlugin,
  PasteTopicsPlugin,
} from '@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasMentionInput/utils/editor-utils'

export interface IPubParmasMentionInputRef {}

export interface IPubParmasMentionInputProps {
  onChange: (value: string) => void
  value: string
  placeholder: string
  maxLength: number
}

const mentionItems = {
  '#': [],
}

// 提及标签样式类名 - 使用 Tailwind 的 arbitrary variant
const mentionStyleClass
  = 'inline-block bg-primary text-primary-foreground rounded-md px-2 py-0.5 text-sm font-medium mx-0.5 align-middle shadow-sm transition-colors'

const editorConfig: InitialConfigType = {
  nodes: [BeautifulMentionNode, PlaceholderNode],
  namespace: 'PublishDescriptionEditor',
  onError(error: Error) {
    throw error
  },
  theme: {
    beautifulMentions: {
      '#': mentionStyleClass,
    },
  },
}

const PubParmasMentionInput = memo(
  forwardRef(
    (
      { onChange, value, placeholder, maxLength }: IPubParmasMentionInputProps,
      ref: ForwardedRef<IPubParmasMentionInputRef>,
    ) => {
      const comboboxAnchor = useRef<HTMLDivElement>(null)
      // 用于防止循环更新：当编辑器内容变化时，记录最新值
      const isInternalChangeRef = useRef(false)

      const handleChange = useCallback(
        (editorState: EditorState, editor: LexicalEditor) => {
          editorState.read(() => {
            const root = $getRoot()
            const text = root.getTextContent()
            // 标记这是内部变化，避免触发外部value同步回来
            isInternalChangeRef.current = true
            onChange(text)
            // 使用 setTimeout 确保外部状态更新后再重置标记
            setTimeout(() => {
              isInternalChangeRef.current = false
            }, 0)
          })
        },
        [onChange],
      )

      const handleSearch = useCallback(async (_trigger: string, _queryString?: string | null) => {
        return []
      }, [])

      // @ts-ignore
      const beautifulMentionsProps: any = {
        comboboxAnchor: comboboxAnchor.current,
        items: mentionItems,
        triggers: ['#'],
        autoSpace: true,
        creatable: {
          '#': 'Add tag "{{name}}"',
        },
        menuComponent: Menu,
        menuItemComponent: MenuItem,
        emptyComponent: undefined,
        insertOnBlur: true,
        allowSpaces: false,
        searchDelay: 200,
        onSearch: handleSearch,
      }

      return (
        <div className="relative rounded-md mb-4" ref={comboboxAnchor} data-desc-editor>
          <LexicalComposer initialConfig={editorConfig}>
            <RichTextPlugin
              contentEditable={(
                <ContentEditable
                  id="mention-input-editor"
                  className="bg-background relative z-[1] w-full flex-1 rounded-md text-sm text-foreground outline-none h-[250px] overflow-auto transition-shadow"
                  style={{ tabSize: 1 }}
                />
              )}
              placeholder={(
                <div className="absolute top-0.5 left-0.5 z-[1001] text-muted-foreground pointer-events-none">
                  {placeholder}
                </div>
              )}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={handleChange} />
            <HistoryPlugin />
            <AutoFocusPlugin defaultSelection="rootStart" />

            <InitialValuePlugin value={value} isInternalChangeRef={isInternalChangeRef} />

            <PasteTopicsPlugin />

            <BeautifulMentionsPlugin {...beautifulMentionsProps} />
          </LexicalComposer>
        </div>
      )
    },
  ),
)

export default PubParmasMentionInput

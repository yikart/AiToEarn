'use client'

import type {
  InitialConfigType,
} from '@lexical/react/LexicalComposer'
import type { EditorState, LexicalEditor } from 'lexical'
import {
  ForwardedRef, useEffect,
} from 'react'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import {
  LexicalComposer,
} from '@lexical/react/LexicalComposer'
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
import React, {
  forwardRef,
  memo,
  useCallback,
  useRef,
} from 'react'
import { getDouyinTopicsApi } from '@/api/dataStatistics'

import {
  Menu,
  MenuItem,
} from '@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasMentionInput/components/Menu'
import {
  InitialValuePlugin,
  PasteTopicsPlugin,
} from '@/components/PublishDialog/compoents/PubParmasTextarea/PubParmasMentionInput/utils/editor-utils'
import styles from './pubParmasMentionInput.module.scss'

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

const editorConfig: InitialConfigType = {
  nodes: [BeautifulMentionNode, PlaceholderNode],
  namespace: 'PublishDescriptionEditor',
  onError(error: Error) {
    throw error
  },
  theme: {
    beautifulMentions: {
      '#': `${styles.mentionsStyle}`,
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

      const handleSearch = useCallback(
        async (trigger: string, queryString?: string | null) => {
          if (!queryString)
            return []
          const res = await getDouyinTopicsApi(queryString!)
          return res?.data ?? []
        },
        [],
      )

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
        <div className={styles.mentionsContainer} ref={comboboxAnchor}>
          <LexicalComposer initialConfig={editorConfig}>
            <RichTextPlugin
              contentEditable={(
                <ContentEditable
                  className={styles.mentionsContentEditable}
                  style={{ tabSize: 1 }}
                />
              )}
              placeholder={
                <div className={styles.mentionsPlaceholder}>{placeholder}</div>
              }
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

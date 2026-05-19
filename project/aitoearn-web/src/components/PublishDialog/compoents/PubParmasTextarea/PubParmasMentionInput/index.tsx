'use client'

/**
 * PubParmasMentionInput - 带 @ 提及功能的文本输入组件
 * 基于 Lexical 编辑器实现
 */
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import type { EditorState, LexicalEditor } from 'lexical'
import type { BeautifulMentionsCssClassNames } from 'lexical-beautiful-mentions'
import type { ForwardedRef } from 'react'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
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
import React, { forwardRef, memo, useCallback, useEffect, useRef } from 'react'

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

const topicMentionClassNames: BeautifulMentionsCssClassNames = {
  container: 'publish-topic-mention',
  containerFocused: 'publish-topic-mention publish-topic-mention-focused',
  trigger: 'publish-topic-mention_trigger',
  value: 'publish-topic-mention_value',
}

const editorConfig: InitialConfigType = {
  nodes: [BeautifulMentionNode, PlaceholderNode],
  namespace: 'PublishDescriptionEditor',
  onError(error: Error) {
    throw error
  },
  theme: {
    beautifulMentions: {
      '#': topicMentionClassNames,
    },
  },
}

/**
 * CompositionSyncPlugin - IME 组合结束后同步文本到父组件
 * 因为 OnChangePlugin 在组合期间被跳过，需要在 compositionend 后补发一次 onChange
 */
function CompositionSyncPlugin({
  onChange,
  lastOutputValueRef,
}: {
  onChange: (value: string) => void
  lastOutputValueRef: React.MutableRefObject<string>
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (!rootElement)
      return

    const handleCompositionEnd = () => {
      const text = editor.getEditorState().read(() => $getRoot().getTextContent())
      if (text !== lastOutputValueRef.current) {
        lastOutputValueRef.current = text
        onChange(text)
      }
    }

    rootElement.addEventListener('compositionend', handleCompositionEnd)
    return () => rootElement.removeEventListener('compositionend', handleCompositionEnd)
  }, [editor, onChange, lastOutputValueRef])

  return null
}

const PubParmasMentionInput = memo(
  forwardRef(
    (
      { onChange, value, placeholder, maxLength }: IPubParmasMentionInputProps,
      ref: ForwardedRef<IPubParmasMentionInputRef>,
    ) => {
      const comboboxAnchor = useRef<HTMLDivElement>(null)
      // 记录编辑器最近一次通过 onChange 输出的值，用于 InitialValuePlugin 判断回传
      const lastOutputValueRef = useRef<string>('')

      const handleChange = useCallback(
        (editorState: EditorState, editor: LexicalEditor) => {
          // IME 组合期间跳过 onChange，防止重渲染打断输入法
          if (editor.isComposing())
            return

          editorState.read(() => {
            const root = $getRoot()
            const text = root.getTextContent()
            lastOutputValueRef.current = text
            onChange(text)
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

            <InitialValuePlugin value={value} lastOutputValueRef={lastOutputValueRef} />
            <CompositionSyncPlugin onChange={onChange} lastOutputValueRef={lastOutputValueRef} />

            <PasteTopicsPlugin />

            <BeautifulMentionsPlugin {...beautifulMentionsProps} />
          </LexicalComposer>
        </div>
      )
    },
  ),
)

export default PubParmasMentionInput

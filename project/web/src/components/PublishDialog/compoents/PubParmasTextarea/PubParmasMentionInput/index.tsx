'use client'

import type {
  InitialConfigType,
} from '@lexical/react/LexicalComposer'
import type { EditorState, LexicalEditor } from 'lexical'
import {
  ForwardedRef, useEffect,
} from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
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
      const driverObjRef = useRef<ReturnType<typeof driver> | null>(null)
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

      // 初始化新手引导 - 提示用户可以划词选择AI功能
      useEffect(() => {
        const hasSeenTextSelectionGuide = localStorage.getItem('hasSeenTextSelectionGuide')
        if (hasSeenTextSelectionGuide) return

        // 延迟显示，确保编辑器已渲染
        const timer = setTimeout(() => {
          // 查找编辑器元素，优先使用 ID，如果没有则通过类名查找
          let editorElement = document.getElementById('mention-input-editor') as HTMLElement
          if (!editorElement) {
            editorElement = document.querySelector('.mentionsContentEditable[contenteditable="true"]') as HTMLElement
            if (editorElement && !editorElement.id) {
              editorElement.id = 'mention-input-editor'
            }
          }
          if (!editorElement) return

          const driverObj = driver({
            showProgress: false,
            showButtons: ['next'],
            nextBtnText: '知道了',
            doneBtnText: '知道了',
            popoverOffset: 10,
            stagePadding: 4,
            stageRadius: 12,
            allowClose: true,
            smoothScroll: true,
            steps: [
              {
                element: '#mention-input-editor',
                popover: {
                  title: '文本选择功能',
                  description: '输入文案后可以划词选择文案选择AI功能',
                  side: 'top',
                  align: 'start',
                  onPopoverRender: () => {
                    setTimeout(() => {
                      const nextBtn = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement
                      const doneBtn = document.querySelector('.driver-popover-done-btn') as HTMLButtonElement
                      const btn = nextBtn || doneBtn
                      if (btn) {
                        btn.textContent = '知道了'
                        const handleClick = (e: MouseEvent) => {
                          e.preventDefault()
                          e.stopPropagation()
                          driverObj.destroy()
                          localStorage.setItem('hasSeenTextSelectionGuide', 'true')
                          btn.removeEventListener('click', handleClick)
                        }
                        btn.addEventListener('click', handleClick)
                      }
                    }, 50)
                  },
                },
              },
            ],
            onNextClick: () => {
              driverObj.destroy()
              localStorage.setItem('hasSeenTextSelectionGuide', 'true')
              return false
            },
            onDestroyStarted: () => {
              localStorage.setItem('hasSeenTextSelectionGuide', 'true')
            },
            onDestroyed: () => {
              localStorage.setItem('hasSeenTextSelectionGuide', 'true')
            },
          })

          driverObjRef.current = driverObj
          driverObj.drive()
        }, 1500)

        return () => {
          clearTimeout(timer)
          if (driverObjRef.current) {
            driverObjRef.current.destroy()
          }
        }
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
        <div className={styles.mentionsContainer} ref={comboboxAnchor}>
          <LexicalComposer initialConfig={editorConfig}>
            <RichTextPlugin
              contentEditable={(
                <ContentEditable
                  id="mention-input-editor"
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

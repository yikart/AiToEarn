import type { MutableRefObject } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
} from 'lexical'
import { BeautifulMentionNode } from 'lexical-beautiful-mentions'
import { useEffect, useRef } from 'react'

/**
 * 插件：根据外部 value 同步更新编辑器内容
 * @param value - 外部传入的文本值
 * @param isInternalChangeRef - 标记是否为内部变化，避免循环更新
 */
export function InitialValuePlugin({
  value,
  isInternalChangeRef,
}: {
  value: string
  isInternalChangeRef?: MutableRefObject<boolean>
}) {
  const [editor] = useLexicalComposerContext()
  const lastAppliedRef = useRef<string>('')

  useEffect(() => {
    // 如果是内部变化触发的，跳过同步，避免循环更新
    if (isInternalChangeRef?.current) {
      return
    }

    editor.update(() => {
      const root = $getRoot()
      const currentText = root.getTextContent()

      // 只有当 value 真正不同时才更新
      if (value === currentText && value === lastAppliedRef.current)
        return

      // 清空并重建内容
      root.clear()
      const paragraph = $createParagraphNode()
      root.append(paragraph)

      if (!value) {
        lastAppliedRef.current = value
        return
      }

      // 按原顺序拆分：话题片段形如 "#xxx"
      const parts = value.split(/(#\S+)/g).filter(Boolean)

      parts.forEach((part) => {
        if (part.startsWith('#')) {
          const topic = part.slice(1)
          if (topic) {
            // @ts-ignore 构造函数依库版本
            const mentionNode = new BeautifulMentionNode('#', topic)
            paragraph.append(mentionNode)
          }
        }
        else {
          if (part) {
            paragraph.append($createTextNode(part))
          }
        }
      })

      lastAppliedRef.current = value
    })
  }, [editor, value, isInternalChangeRef])

  return null
}

export function PasteTopicsPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardText = event.clipboardData?.getData('text/plain')
        if (!clipboardText)
          return false

        event.preventDefault()

        editor.update(() => {
          const selection = $getSelection()
          // 仅处理普通范围选区
          if (!$isRangeSelection(selection))
            return

          // 删除当前选区内容
          selection.removeText()

          const lines = clipboardText.split(/\r?\n/)
          lines.forEach((line, idx) => {
            const parts = line.split(/(#\S+)/g).filter(Boolean)
            parts.forEach((part) => {
              if (part.startsWith('#')) {
                const topic = part.slice(1)
                if (topic) {
                  // @ts-ignore
                  const mentionNode = new BeautifulMentionNode('#', topic)
                  selection.insertNodes([mentionNode])
                }
              }
              else {
                selection.insertText(part)
              }
            })
            // 换行 -> 新段落
            if (idx < lines.length - 1) {
              const p = $createParagraphNode()
              selection.insertNodes([p])
              p.select()
            }
          })
        })

        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor])

  return null
}

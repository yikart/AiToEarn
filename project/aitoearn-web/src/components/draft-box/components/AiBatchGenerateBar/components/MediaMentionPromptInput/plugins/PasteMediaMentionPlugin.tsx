import type { PasteMediaMentionPluginProps } from '../types'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, PASTE_COMMAND } from 'lexical'
import { $createBeautifulMentionNode } from 'lexical-beautiful-mentions'
import { useEffect } from 'react'
import { appendTextWithMediaMentions, createMentionData } from '../utils/mentionItems'

export function PasteMediaMentionPlugin({
  itemsByValue,
  onPasteFiles,
}: PasteMediaMentionPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const files = Array.from(event.clipboardData?.items ?? [])
          .filter(item => item.kind === 'file')
          .map(item => item.getAsFile())
          .filter((file): file is File => Boolean(file))

        if (files.length > 0) {
          if (!onPasteFiles)
            return false
          event.preventDefault()
          const dataTransfer = new DataTransfer()
          files.forEach(file => dataTransfer.items.add(file))
          onPasteFiles(dataTransfer.files)
          return true
        }

        const clipboardText = event.clipboardData?.getData('text/plain')
        if (!clipboardText || !/@Image[1-9]|@Video[1-3]|@Audio[1-3]/.test(clipboardText))
          return false

        event.preventDefault()
        editor.update(() => {
          const selection = $getSelection()
          if (!$isRangeSelection(selection))
            return

          selection.removeText()
          const lines = clipboardText.split(/\r?\n/)
          lines.forEach((line, lineIndex) => {
            if (lineIndex > 0)
              selection.insertLineBreak()

            appendTextWithMediaMentions((text, mentionValue) => {
              if (mentionValue) {
                selection.insertNodes([
                  $createBeautifulMentionNode(
                    '@',
                    mentionValue,
                    createMentionData(itemsByValue.get(mentionValue)),
                  ),
                ])
                return
              }
              if (typeof text === 'string')
                selection.insertText(text)
            }, line)
          })
        })
        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor, itemsByValue, onPasteFiles])

  return null
}

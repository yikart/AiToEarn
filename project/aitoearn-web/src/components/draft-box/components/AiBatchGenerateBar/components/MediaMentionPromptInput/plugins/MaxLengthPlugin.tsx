import type { MaxLengthPluginProps } from '../types'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { useEffect } from 'react'
import { setEditorTextContent } from '../utils/mentionItems'

export function MaxLengthPlugin({
  maxLength,
  itemsByValue,
  lastOutputValueRef,
  onChange,
}: MaxLengthPluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      if (editor.isComposing())
        return

      const text = editorState.read(() => $getRoot().getTextContent())
      if (text.length <= maxLength)
        return

      const nextText = text.slice(0, maxLength)
      lastOutputValueRef.current = nextText
      onChange(nextText)
      editor.update(() => setEditorTextContent(nextText, itemsByValue))
    })
  }, [editor, itemsByValue, lastOutputValueRef, maxLength, onChange])

  return null
}

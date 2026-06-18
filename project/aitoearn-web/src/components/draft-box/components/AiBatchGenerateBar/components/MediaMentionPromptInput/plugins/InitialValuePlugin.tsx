import type { InitialValuePluginProps } from '../types'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { useEffect } from 'react'
import { setEditorTextContent } from '../utils/mentionItems'

export function InitialValuePlugin({
  value,
  itemsByValue,
  lastOutputValueRef,
}: InitialValuePluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (value === lastOutputValueRef.current)
      return

    const currentText = editor.getEditorState().read(() => $getRoot().getTextContent())
    if (value === currentText)
      return

    editor.update(() => setEditorTextContent(value, itemsByValue))
  }, [editor, itemsByValue, lastOutputValueRef, value])

  return null
}

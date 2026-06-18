import type { CompositionSyncPluginProps } from '../types'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'
import { useEffect } from 'react'

export function CompositionSyncPlugin({
  onChange,
  lastOutputValueRef,
}: CompositionSyncPluginProps) {
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
  }, [editor, lastOutputValueRef, onChange])

  return null
}

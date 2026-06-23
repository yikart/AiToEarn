import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { COMMAND_PRIORITY_HIGH, KEY_ENTER_COMMAND, KEY_TAB_COMMAND } from 'lexical'
import { useEffect } from 'react'
import { hasActiveMediaMentionQuery } from '../utils/mentionItems'

export function EmptyMediaMentionActionGuardPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const handleSelectEmptyAction = (event: globalThis.KeyboardEvent | null) => {
      if (!hasActiveMediaMentionQuery())
        return false

      event?.preventDefault()
      event?.stopImmediatePropagation()
      return true
    }

    return editor.registerCommand(KEY_ENTER_COMMAND, handleSelectEmptyAction, COMMAND_PRIORITY_HIGH)
  }, [editor])

  useEffect(() => {
    const handleSelectEmptyAction = (event: globalThis.KeyboardEvent) => {
      if (!hasActiveMediaMentionQuery())
        return false

      event.preventDefault()
      event.stopImmediatePropagation()
      return true
    }

    return editor.registerCommand(KEY_TAB_COMMAND, handleSelectEmptyAction, COMMAND_PRIORITY_HIGH)
  }, [editor])

  return null
}

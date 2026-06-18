import type { MediaMentionContextValue } from '../types'
import { createContext, useContext } from 'react'

export const MediaMentionContext = createContext<MediaMentionContextValue | null>(null)

export function useMediaMentionContext() {
  const context = useContext(MediaMentionContext)
  if (!context) {
    throw new Error('MediaMentionPromptInput context is missing')
  }
  return context
}

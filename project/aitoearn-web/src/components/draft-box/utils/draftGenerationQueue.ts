import type { DraftGenerationTask } from '@/api/ai/ai.types'

export type DraftGenerationQueueDisplay
  = { type: 'queued', count: number }
    | { type: 'generating' }

export function getDraftGenerationQueueDisplay(task: DraftGenerationTask): DraftGenerationQueueDisplay | null {
  if (task.status !== 'generating')
    return null

  const position = task.queue?.position
  if (typeof position === 'number' && Number.isFinite(position) && position > 0) {
    return {
      type: 'queued',
      count: Math.floor(position),
    }
  }

  return { type: 'generating' }
}

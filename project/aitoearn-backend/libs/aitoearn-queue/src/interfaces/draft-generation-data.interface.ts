import { UserType } from '@yikart/common'

export interface DraftGenerationData {
  aiLogId: string
  userId: string
  userType: UserType
  groupId: string
  version: 'v2' | 'v2-image-text'
  prompt?: string
  captionPrompt?: string
  imageUrls?: string[]
  model?: string
  duration?: number
  resolution?: string
  aspectRatio?: string
  videoUrls?: string[]
  imageModel?: string
  imageCount?: number
  imageSize?: string
  draftType?: 'draft' | 'video'
  imageTextDraftType?: 'draft' | 'image'
  platforms?: string[]
  plannerModel?: string
  disableMemory?: boolean
  queuePriority?: number
}

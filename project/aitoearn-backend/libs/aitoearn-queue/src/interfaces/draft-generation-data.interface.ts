import { UserType } from '@yikart/common'

export interface DraftGenerationData {
  aiLogId: string
  userId: string
  userType: UserType
  groupId: string
  version?: 'v1' | 'v2' | 'v2-image-text'
  prompt?: string
  imageUrls?: string[]
  model?: string
  duration?: number
  aspectRatio?: string
  videoUrls?: string[]
  imageModel?: string
  imageCount?: number
  imageSize?: string
  draftType?: 'draft' | 'video'
  imageTextDraftType?: 'draft' | 'image'
  platforms?: string[]
}

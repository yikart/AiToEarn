import { PostCategory, PostMediaStatus } from '@yikart/channel-db'
import { PublishStatus } from '@yikart/mongodb'

export interface PublishingTaskResult {
  status: PublishStatus
  postId?: string
  permalink?: string
  shortLink?: string
  extra?: Record<string, any>
}

export interface MediaProcessingStatus {
  id: string
  taskId: string
  category: PostCategory
  status: PostMediaStatus
}

export interface MediaProcessingStatusResult {
  medias: MediaProcessingStatus[]
  isCompleted: boolean
  hasFailed: boolean
}

export interface VerifyPublishResult {
  success: boolean
  workLink?: string
  errorMsg?: string
}

import { PostCategory, PostMediaStatus } from '../../libs/database/schema/postMediaContainer.schema'
import { PublishStatus } from '../../libs/database/schema/publishTask.schema'

export interface PublishingTaskResult {
  status: PublishStatus
  postId?: string
  permalink?: string
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

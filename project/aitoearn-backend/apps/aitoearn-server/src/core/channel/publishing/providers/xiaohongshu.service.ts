import { Injectable, Logger } from '@nestjs/common'
import { AssetsService } from '@yikart/assets'
import { PublishRecord, PublishStatus } from '@yikart/mongodb'
import { PublishingTaskResult, VerifyPublishResult } from '../publishing.interface'
import { PublishService } from './base.service'

@Injectable()
export class XiaohongshuPubService extends PublishService {
  private readonly logger = new Logger(XiaohongshuPubService.name)

  constructor(
    private readonly assetsService: AssetsService,
  ) {
    super()
  }

  async immediatePublish(publishTask: PublishRecord): Promise<PublishingTaskResult> {
    if (!publishTask.accountId) {
      throw new Error(`No account ID found for task: ${publishTask.id}`)
    }

    this.logger.log(`Publishing to Xiaohongshu: ${publishTask.title || publishTask.desc?.slice(0, 50)}`)

    // Build title and description
    const title = publishTask.title || publishTask.desc?.slice(0, 50) || ''
    const desc = publishTask.desc || ''
    const topics = publishTask.topics || []

    this.logger.debug(`XHS Publish - title: ${title}, desc length: ${desc.length}, topics: ${topics.join(', ')}`)

    // TODO: Implement actual Xiaohongshu API call
    // Xiaohongshu API is not publicly available - requires official partnership
    // This is a placeholder that logs the intent

    // Placeholder: Return mock success
    // In production, this would call xiaohongshuService.publishNote()
    const mockNoteId = `xhs_${Date.now()}`

    this.logger.log(`[PLACEHOLDER] Xiaohongshu publish succeeded for task ${publishTask.id}`)

    return {
      postId: mockNoteId,
      permalink: `https://www.xiaohongshu.com/explore/${mockNoteId}`,
      status: PublishStatus.PUBLISHED,
    }
  }

  async verifyAndCompletePublish(publishRecord: PublishRecord): Promise<VerifyPublishResult> {
    if (!publishRecord.accountId || !publishRecord.dataId) {
      return { success: false, errorMsg: 'Missing account or data ID' }
    }

    try {
      // TODO: Implement actual verification
      // In production, this would call xiaohongshuService.getNoteInfo()

      // Placeholder: Return mock success
      return {
        success: true,
        workLink: `https://www.xiaohongshu.com/explore/${publishRecord.dataId}`,
      }
    }
    catch (error) {
      return { success: false, errorMsg: `Verify failed: ${(error as Error).message}` }
    }
  }
}
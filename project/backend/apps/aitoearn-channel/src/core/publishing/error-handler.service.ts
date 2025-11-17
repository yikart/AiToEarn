import { Injectable, Logger } from '@nestjs/common'
import { AccountType } from '@yikart/common'
import { Job, UnrecoverableError } from 'bullmq'
import { PublishStatus } from '../../libs/database/schema/publishTask.schema'
import { SocialMediaError } from '../../libs/exception'
import { CredentialInvalidationService } from './credential-invalidation.service'
import { PublishingException } from './publishing.exception'
import { PublishingService } from './publishing.service'

@Injectable()
export class PublishingErrorHandler {
  private readonly logger = new Logger(PublishingErrorHandler.name)

  constructor(
    private readonly publishingService: PublishingService,
    private readonly credentialInvalidationService: CredentialInvalidationService,
  ) {}

  private async failTask(taskId: string, message: string) {
    await this.publishingService.updatePublishTaskStatus(taskId, {
      status: PublishStatus.FAILED,
      errorMsg: message,
      inQueue: false,
      queued: false,
    })
  }

  private async handleAuthFailure(taskId: string) {
    try {
      const task = await this.publishingService.getPublishTaskInfo(taskId)
      if (!task) {
        this.logger.warn(`Unable to load task/account info for auth failure, taskId=${taskId}`)
        return
      }
      await this.credentialInvalidationService.invalidate(
        task.accountId,
        task.accountType as AccountType,
      )
    }
    catch (err) {
      this.logger.warn(`Auth failure cleanup encountered an error for taskId=${taskId}: ${err?.message}`)
    }
  }

  async handle(
    taskId: string,
    error: unknown,
    _job?: Job,
  ): Promise<never> {
    if (error instanceof PublishingException) {
      if (error.retryable) {
        throw error
      }
      await this.failTask(taskId, error.message)
      throw new UnrecoverableError(error.message)
    }

    if (error instanceof SocialMediaError) {
      if (error.isNetworkError) {
        throw error
      }
      if (error.status === 401) {
        await this.handleAuthFailure(taskId)
        await this.failTask(taskId, error.message)
        throw new UnrecoverableError(error.message)
      }
      const message = error.message || 'Client error'
      await this.failTask(taskId, message)
      throw new UnrecoverableError(message)
    }
    const message = error.toString() || 'Unknown error'
    await this.failTask(taskId, message)
    throw new UnrecoverableError(message)
  }
}

import { Injectable, Logger } from '@nestjs/common'
import { ResponseCode } from '../../libs/common/enums'
import { AppException } from '../../libs/common/exceptions/app.exception'
import { Account, ApiKeyAccountRepository, PublishingTaskType, PublishStatus, PublishTaskRepository } from '../../libs/mongodb'
import { AccountService } from '../account/account.service'
import { CreatePublishingTaskDto } from './dto/publishing.dto'

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name)
  constructor(
    private readonly accountService: AccountService,
    private readonly publishTaskRepository: PublishTaskRepository,
    private readonly apiKeyAccountRepository: ApiKeyAccountRepository,
  ) { }

  async createPublishingTask(accountId: string, data: CreatePublishingTaskDto) {
    const now = new Date()
    const defaultPublishingTime = new Date(now.getTime() + 2 * 60 * 1000)
    const publishingTime = data.publishingTime ? new Date(data.publishingTime) : defaultPublishingTime
    if (publishingTime < now) {
      throw new Error('publishingTime cannot be less than the current time')
    }

    const accountInfo = await this.accountService.getAccountById(accountId)
    if (!accountInfo || !accountInfo.id)
      throw new AppException(ResponseCode.AccountNotFound)

    const { imgUrlList, topics } = data

    const task = await this.publishTaskRepository.createPublishTask({
      accountId,
      type: PublishingTaskType.VIDEO,
      accountType: accountInfo.type,
      title: data.title || '',
      desc: data.desc || '',
      videoUrl: data.videoUrl || '',
      coverUrl: data.coverUrl || '',
      option: data.option,
      publishTime: publishingTime,
      imgUrlList: imgUrlList || [],
      topics,
    })
    return { id: task.id, status: task.status }
  }

  async batchCreatePublishingTask(apiKey: string, data: CreatePublishingTaskDto): Promise<{ success: boolean }> {
    const apiKeyAccounts = await this.apiKeyAccountRepository.list({ apiKey })
    if (!apiKeyAccounts || apiKeyAccounts.length === 0) {
      throw new Error('Api key not found')
    }
    for (const apiKeyAccount of apiKeyAccounts) {
      await this.createPublishingTask(apiKeyAccount.accountId, data)
    }
    return { success: true }
  }

  async listLinkedAccounts(apiKey: string): Promise<Account[]> {
    const apiKeyAccounts = await this.apiKeyAccountRepository.list({ apiKey })
    const accounts = await this.accountService.getAccountListByIds(apiKeyAccounts.map(apiKeyAccount => apiKeyAccount.accountId))
    if (!accounts || accounts.length === 0) {
      return []
    }
    return accounts
  }

  async getPublishingTaskStatus(userId: string, taskId: string): Promise<{ id: string, status: PublishStatus }> {
    const publishingTask = await this.publishTaskRepository.getPublishTask(userId, taskId)
    if (publishingTask) {
      return {
        id: taskId,
        status: publishingTask.status,
      }
    }
    throw new AppException(ResponseCode.PublishTaskNotFound)
  }
}

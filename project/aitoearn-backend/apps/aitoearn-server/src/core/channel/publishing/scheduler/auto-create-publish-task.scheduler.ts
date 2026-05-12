import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Redlock } from '@yikart/redlock'
import { EarnInfoStatus, MediaType, PublishType, UserRepository } from '@yikart/mongodb'
import { RedlockKey } from '../../../../common/enums'
import { AccountService } from '../../../account/account.service'
import { MaterialService } from '../../../content/material.service'
import { PublishingService } from '../publishing.service'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class AutoCreatePublishTaskScheduler {
  private readonly logger = new Logger(AutoCreatePublishTaskScheduler.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly publishingService: PublishingService,
    private readonly materialService: MaterialService,
    private readonly accountService: AccountService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  @Redlock(RedlockKey.AutoCreatePublishTask, 60, { throwOnFailure: false })
  async autoCreatePublishTasks() {
    this.logger.log('=== Auto-create publish task scheduler STARTED ===')

    try {
      const [userList] = await this.userRepository.listWithOpenEarnInfo(1, 100)
      this.logger.debug(`Found ${userList.length} users with auto-earn enabled`)

      for (const user of userList) {
        this.logger.debug(`Checking user ${user.id}, earnInfo: ${JSON.stringify(user.earnInfo)}`)
        if (!user.earnInfo?.cycleInterval) {
          this.logger.debug(`User ${user.id} has no cycleInterval, skipping`)
          continue
        }
        this.logger.log(`Processing user ${user.id} for auto-create publish task`)
        await this.createPublishTaskForUser(user.id)
      }

      this.logger.log('=== Auto-create publish task scheduler COMPLETED ===')
    } catch (error) {
      this.logger.error('Auto-create publish task scheduler failed', error)
    }
  }

  private async createPublishTaskForUser(userId: string) {
    try {
      const accounts = await this.accountService.getUserAccounts(userId)
      this.logger.debug(`User ${userId} has ${accounts.length} accounts`)
      this.logger.debug(`Accounts: ${accounts.map(a => `${a.id}(${a.type})`).join(', ')}`)

      for (const account of accounts) {
        this.logger.debug(`Processing account ${account.id} of type ${account.type}`)
        // groupId 传 undefined 而不是空字符串，否则无法匹配素材
        const material = await this.materialService.optimalInGroup(undefined, undefined, account.type)
        if (!material) {
          this.logger.debug(`No material found for user ${userId}, account ${account.type} (account.id=${account.id})`)
          this.logger.debug(`Looking for material with accountTypes containing: ${account.type}`)
          continue
        }

        this.logger.log(`Creating publish task for user ${userId}, account ${account.id} with material ${material.id} (useCount: ${material.useCount})`)

        try {
          const result = await this.publishingService.createPublishingTask({
            flowId: uuidv4(),
            accountId: account.id,
            accountType: account.type,
            type: material.type as unknown as PublishType,
            title: material.title,
            desc: material.desc,
            videoUrl: material.mediaList.find(m => m.type === MediaType.VIDEO)?.url,
            coverUrl: material.coverUrl,
            imgUrlList: material.mediaList.filter(m => m.type === MediaType.IMG).map(m => m.url),
            publishTime: new Date(),
            topics: material.topics || [],
            materialId: material.id,
            materialGroupId: material.groupId,
          })
          this.logger.log(`SUCCESS: Auto-created publish task for user ${userId}, account ${account.id}, task created`)
        } catch (publishError) {
          this.logger.error(`FAILED to create publish task for user ${userId}, account ${account.id}: ${publishError}`)
        }
      }
    } catch (error) {
      this.logger.error(`Failed to create publish task for user ${userId}`, error)
    }
  }
}
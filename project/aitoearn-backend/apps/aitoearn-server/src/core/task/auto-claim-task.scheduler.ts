import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Redlock } from '@yikart/redlock'
import { EarnInfoStatus, UserRepository } from '@yikart/mongodb'
import { QueueService } from '@yikart/aitoearn-queue'
import { EngagementRecordService } from '../channel/engagement/engagement.record.service'
import { AccountService } from '../account/account.service'
import { RedlockKey } from '../../common/enums'

@Injectable()
export class AutoClaimTaskScheduler {
  private readonly logger = new Logger(AutoClaimTaskScheduler.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly engagementRecordService: EngagementRecordService,
    private readonly accountService: AccountService,
    private readonly queueService: QueueService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  @Redlock(RedlockKey.AutoClaimEngagementTask, 30, { throwOnFailure: false })
  async autoClaimTasksForUsers() {
    this.logger.debug('Starting auto-claim task scheduler')

    try {
      const [userList] = await this.userRepository.listWithOpenEarnInfo(1, 100)
      this.logger.debug(`Found ${userList.length} users with auto-earn enabled`)

      for (const user of userList) {
        if (!user.earnInfo?.cycleInterval) {
          continue
        }

        await this.claimTaskForUser(user.id)
      }

      this.logger.debug('Auto-claim task scheduler completed')
    } catch (error) {
      this.logger.error('Auto-claim task scheduler failed', error)
    }
  }

  private async claimTaskForUser(userId: string) {
    try {
      const availableTasks = await this.engagementRecordService.listAvailableEngagementTasks({
        limit: 1,
        excludeUserId: userId,
      })

      if (availableTasks.length === 0) {
        this.logger.debug(`No available tasks for user ${userId}`)
        return
      }

      const task = availableTasks[0]

      const account = await this.findAccountForUser(userId, task.platform)
      if (!account) {
        this.logger.debug(`No account found for user ${userId} on platform ${task.platform}`)
        return
      }

      const result = await this.engagementRecordService.claimEngagementTask(task.id, {
        accountId: account.id,
        userId: userId,
      })

      if (result) {
        this.logger.log(`Auto-claimed task ${task.id} for user ${userId} using account ${account.id}`)
        await this.queueService.addEngagementTaskDistributionJob(
          { taskId: task.id, attempts: 0 },
          { jobId: `engagement:auto-claim:${task.id}` },
        )
        this.logger.log(`Enqueued task ${task.id} for execution`)
      }
    } catch (error) {
      this.logger.error(`Failed to claim task for user ${userId}`, error)
    }
  }

  private async findAccountForUser(userId: string, platform: string) {
    try {
      const accounts = await this.accountService.getUserAccounts(userId)
      const matchingAccount = accounts.find(acc => acc.type.toLowerCase() === platform.toLowerCase())
      return matchingAccount || null
    } catch (error) {
      this.logger.error(`Failed to find account for user ${userId} on platform ${platform}`, error)
      return null
    }
  }
}
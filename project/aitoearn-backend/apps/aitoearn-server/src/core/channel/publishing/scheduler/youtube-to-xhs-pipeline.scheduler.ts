import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Redlock } from '@yikart/redlock'
import { AccountType, PublishType } from '@yikart/aitoearn-server-client'
import { UserType } from '@yikart/common'
import { UserRepository } from '@yikart/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { RedlockKey } from '../../../../common/enums'
import { AiService, UserChatCompletionDto } from '@yikart/aitoearn-ai-client'
import { AccountService } from '../../../account/account.service'
import { YoutubeService } from '../../platforms/youtube/youtube.service'
import { PublishingService } from '../publishing.service'

interface TranslatedContent {
  title: string
  content: string
  topics: string[]
}

@Injectable()
export class YoutubeToXhsPipelineScheduler {
  private readonly logger = new Logger(YoutubeToXhsPipelineScheduler.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly youtubeService: YoutubeService,
    private readonly accountService: AccountService,
    private readonly aiService: AiService,
    private readonly publishingService: PublishingService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  @Redlock(RedlockKey.YoutubeToXhsPipeline, 300, { throwOnFailure: false })
  async runPipeline() {
    this.logger.log('=== YouTube → XHS pipeline STARTED ===')

    try {
      const [userList] = await this.userRepository.listWithOpenEarnInfo(1, 100)
      this.logger.log(`[YouTube→XHS] Found ${userList.length} users with auto-earn enabled`)

      if (userList.length === 0) {
        this.logger.warn('[YouTube→XHS] No users found with auto-earn enabled')
        return
      }

      for (const user of userList) {
        this.logger.debug(`[YouTube→XHS] Checking user ${user.id}, earnInfo: ${JSON.stringify(user.earnInfo)}`)
        if (!user.earnInfo?.cycleInterval) {
          this.logger.debug(`[YouTube→XHS] User ${user.id} has no cycleInterval, skipping`)
          continue
        }
        this.logger.log(`[YouTube→XHS] Processing user ${user.id} for YouTube→XHS pipeline`)
        await this.processUser(user.id)
      }

      this.logger.log('=== YouTube → XHS pipeline COMPLETED ===')
    }
    catch (error) {
      this.logger.error(`[YouTube→XHS] Pipeline failed: ${(error as Error).message}`, (error as Error).stack)
    }
  }

  async processUser(userId: string) {
    try {
      // Get YouTube accounts for this user
      const youtubeAccounts = await this.accountService.getUserAccounts(userId)
        .then(accounts => accounts.filter(a => a.type.toLowerCase() === 'youtube'))

      if (youtubeAccounts.length === 0) {
        this.logger.debug(`No YouTube account for user ${userId}`)
        return
      }

      // Get Xiaohongshu accounts for this user
      const xhsAccounts = await this.accountService.getUserAccounts(userId)
        .then(accounts => accounts.filter(a => a.type.toLowerCase() === 'xhs' || a.type.toLowerCase() === 'xiaohongshu'))

      if (xhsAccounts.length === 0) {
        this.logger.debug(`No Xiaohongshu account for user ${userId}`)
        return
      }

      const youtubeAccount = youtubeAccounts[0]
      const xhsAccount = xhsAccounts[0]

      // Step 1: Get most popular videos from YouTube
      const popularVideos = await this.youtubeService.getVideosList(
        youtubeAccount.id,
        'mostPopular',
        undefined,
        undefined,
        20,
      ) as any

      if (!popularVideos?.items?.length) {
        this.logger.debug(`No popular videos found for account ${youtubeAccount.id}`)
        return
      }

      this.logger.log(`Found ${popularVideos.items.length} popular YouTube videos`)

      // Process top 3 videos
      for (const video of popularVideos.items.slice(0, 3)) {
        try {
          const title = video.snippet?.title || ''
          const description = video.snippet?.description || ''
          const videoId = video.id || ''

          if (!title) {
            continue
          }

          // Step 2: AI translate title and description to Chinese
          const translated = await this.translateToChinese(title, description, videoId)

          // Step 3: Create Xiaohongshu publish task (图文帖子)
          await this.publishingService.createPublishingTask({
            flowId: uuidv4(),
            accountId: xhsAccount.id,
            accountType: AccountType.Xhs,
            type: PublishType.ARTICLE,
            title: translated.title,
            desc: translated.content,
            topics: translated.topics,
            publishTime: new Date(),
          })

          this.logger.log(`Created XHS task for YouTube video ${videoId} (${title})`)
        }
        catch (err) {
          const error = err as Error
          this.logger.error(`Failed to process video ${video.id}: ${error.message}`)
        }
      }
    }
    catch (err) {
      const error = err as Error
      this.logger.error(`Failed to process user ${userId}: ${error.message}`)
    }
  }

  private async translateToChinese(title: string, description: string, videoId: string): Promise<TranslatedContent> {
    const prompt = `Translate the following YouTube video information to Chinese for Xiaohongshu (Chinese social media platform).
Generate a suitable title (max 20 Chinese characters), content description (max 500 Chinese characters), and 3-5 relevant Chinese hashtags as topics.

YouTube Video Title:
${title.slice(0, 200)}

YouTube Video Description:
${description.slice(0, 1000)}

Video ID: ${videoId}

Respond in JSON format:
{
  "title": "Chinese title (max 20 chars)",
  "content": "Translated Chinese content (max 500 chars)",
  "topics": ["话题1", "话题2", "话题3"]
}`

    try {
      const chatDto: UserChatCompletionDto = {
        userId: 'system',
        userType: UserType.System,
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-sonnet-4-5',
      }
      const result = await this.aiService.chatCompletion(chatDto)

      let content = ''
      if (result.content && result.content.length > 0) {
        const firstContent = result.content[0]
        if (typeof firstContent === 'string') {
          content = firstContent
        }
        else if ('text' in firstContent) {
          content = firstContent.text
        }
      }
      const jsonMatch = content.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as TranslatedContent
      }

      // Fallback if JSON parsing fails
      return {
        title: title.slice(0, 20),
        content: description.slice(0, 500),
        topics: ['油管精选', '海外热点'],
      }
    }
    catch (err) {
      const error = err as Error
      this.logger.error(`Translation failed: ${error.message}`)
      // Return minimal fallback
      return {
        title: title.slice(0, 20),
        content: description.slice(0, 500),
        topics: ['翻译内容'],
      }
    }
  }
}
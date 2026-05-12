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
import { TwitterService } from '../../platforms/twitter/twitter.service'
import { PublishingService } from '../publishing.service'

interface TranslatedContent {
  title: string
  content: string
  topics: string[]
}

@Injectable()
export class TwitterToXhsPipelineScheduler {
  private readonly logger = new Logger(TwitterToXhsPipelineScheduler.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly twitterService: TwitterService,
    private readonly accountService: AccountService,
    private readonly aiService: AiService,
    private readonly publishingService: PublishingService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  @Redlock(RedlockKey.TwitterToXhsPipeline, 300, { throwOnFailure: false })
  async runPipeline() {
    this.logger.log('=== Twitter → XHS pipeline STARTED ===')

    try {
      const [userList] = await this.userRepository.listWithOpenEarnInfo(1, 100)
      this.logger.log(`[Twitter→XHS] Found ${userList.length} users with auto-earn enabled`)

      if (userList.length === 0) {
        this.logger.warn('[Twitter→XHS] No users found with auto-earn enabled')
        return
      }

      for (const user of userList) {
        this.logger.debug(`[Twitter→XHS] Checking user ${user.id}, earnInfo: ${JSON.stringify(user.earnInfo)}`)
        if (!user.earnInfo?.cycleInterval) {
          this.logger.debug(`[Twitter→XHS] User ${user.id} has no cycleInterval, skipping`)
          continue
        }
        this.logger.log(`[Twitter→XHS] Processing user ${user.id} for Twitter→XHS pipeline`)
        await this.processUser(user.id)
      }

      this.logger.log('=== Twitter → XHS pipeline COMPLETED ===')
    }
    catch (error) {
      this.logger.error(`[Twitter→XHS] Pipeline failed: ${(error as Error).message}`, (error as Error).stack)
    }
  }

  async processUser(userId: string) {
    try {
      // Get Twitter accounts for this user
      const twitterAccounts = await this.accountService.getUserAccounts(userId)
        .then(accounts => accounts.filter(a => a.type.toLowerCase() === 'twitter'))

      if (twitterAccounts.length === 0) {
        this.logger.debug(`No Twitter account for user ${userId}`)
        return
      }

      // Get Xiaohongshu accounts for this user
      const xhsAccounts = await this.accountService.getUserAccounts(userId)
        .then(accounts => accounts.filter(a => a.type.toLowerCase() === 'xhs' || a.type.toLowerCase() === 'xiaohongshu'))

      if (xhsAccounts.length === 0) {
        this.logger.debug(`No Xiaohongshu account for user ${userId}`)
        return
      }

      const twitterAccount = twitterAccounts[0]
      const xhsAccount = xhsAccounts[0]

      // Step 1: Get trending topics
      const trending = await this.twitterService.getTrendingTopics(twitterAccount.id)
      if (!trending?.data?.length) {
        this.logger.debug(`No trending topics for account ${twitterAccount.id}`)
        return
      }

      // Take top 5 trending topics
      const keywords = trending.data.slice(0, 5).map(t => t.name)

      // Step 2: Search and process tweets for each keyword
      for (const keyword of keywords) {
        const searchResults = await this.twitterService.searchTweets(
          twitterAccount.id,
          keyword,
          20,
        )

        if (!searchResults?.data?.length) {
          continue
        }

        // Process top 3 tweets per keyword
        for (const tweet of searchResults.data.slice(0, 3)) {
          try {
            // Step 3: AI translate
            const translated = await this.translateToChinese(tweet.text)

            // Step 4: Create Xiaohongshu publish task
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

            this.logger.log(`Created XHS task for tweet ${tweet.id} (keyword: ${keyword})`)
          }
          catch (err) {
            const error = err as Error
            this.logger.error(`Failed to process tweet ${tweet.id}: ${error.message}`)
          }
        }
      }
    }
    catch (err) {
      const error = err as Error
      this.logger.error(`Failed to process user ${userId}: ${error.message}`)
    }
  }

  private async translateToChinese(text: string): Promise<TranslatedContent> {
    const prompt = `Translate the following tweet to Chinese for Xiaohongshu (Chinese social media platform).
Generate a suitable title (max 20 Chinese characters), content (max 500 Chinese characters), and 3-5 relevant Chinese hashtags as topics.

Tweet content:
${text.slice(0, 500)}

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
        title: text.slice(0, 20),
        content: text.slice(0, 500),
        topics: ['翻译', '海外热点'],
      }
    }
    catch (err) {
      const error = err as Error
      this.logger.error(`Translation failed: ${error.message}`)
      // Return minimal fallback
      return {
        title: text.slice(0, 20),
        content: text.slice(0, 500),
        topics: ['翻译内容'],
      }
    }
  }
}
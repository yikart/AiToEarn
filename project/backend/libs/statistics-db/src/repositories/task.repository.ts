import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Connection, Model } from 'mongoose'
import { PostData } from '../common/post'
import { UserTaskPosts } from '../schemas'
import { BaseRepository } from './base.repository'
import { PostRepository } from './post.repository'

@Injectable()
export class TaskRepository extends BaseRepository<UserTaskPosts> implements OnModuleInit {
  private readonly logger = new Logger(TaskRepository.name)

  constructor(
    @InjectConnection('statistics-db-connection') private readonly connection: Connection,
    private readonly postRepository: PostRepository,
  ) {
    super(null as any) // Temporarily use null, will set the correct model later
  }

  async onModuleInit() {
    // Wait for database connection to be established
    await this.waitForConnection()
  }

  /**
   * Get UserTaskPosts model
   */
  private getUserTaskPostsModel(): Model<UserTaskPosts> {
    return this.connection.model(UserTaskPosts.name) as Model<UserTaskPosts>
  }

  /**
   * Wait for database connection to be established
   */
  private async waitForConnection(maxAttempts = 30): Promise<void> {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const currentState = this.connection.readyState
      this.logger.log(`Waiting for database connection... (${attempt}/${maxAttempts}) - State: ${states[currentState as keyof typeof states]} (${currentState})`)

      if (currentState === 1) {
        this.logger.log('Database connection established')
        return
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    this.logger.error('Database connection timeout')
  }

  // Record user task posts
  async userTaskPosts(accountId: string, type: AccountType, uid: string, taskId: string, postId: string, userId?: string) {
    const result = await this.getUserTaskPostsModel().create({
      userId,
      accountId,
      type,
      uid,
      taskId,
      postId,
      createdAt: new Date(),
    })
    this.logger.debug(`PostDataIncrease result: ${JSON.stringify(result)}`)
    return result
  }

  // Query posts by taskId
  async getTaskPostsByTaskId(taskId: string) {
    const result = await this.getUserTaskPostsModel().find({ taskId })
    this.logger.debug(`TaskPostsByTaskId result: ${JSON.stringify(result)}`)
    return result
  }

  /**
   * Get posts data by task ID and aggregate statistics
   * @param taskId Task ID
   * @returns Aggregated statistics result
   */
  async getTaskPostsSummary(taskId: string) {
    const TaskPosts = await this.getTaskPostsByTaskId(taskId)
    this.logger.debug('TaskPosts:', TaskPosts)

    // Group by type and extract postId arrays for each platform
    const groupedByType = TaskPosts.reduce((acc, item) => {
      const type = item.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(item.postId)
      return acc
    }, {} as Record<string, string[]>)

    this.logger.debug('Grouped by type:', groupedByType)

    // Initialize summary result
    const summary = {
      taskPosts: TaskPosts, // Original TaskPosts array
      platformData: {} as Record<string, unknown>, // Detailed data for each platform
      totalViewCount: 0,
      totalCommentCount: 0,
      totalLikeCount: 0,
      totalShareCount: 0,
      totalClickCount: 0,
      totalImpressionCount: 0,
      totalFavoriteCount: 0,
      updatedAt: new Date(),
    }

    // Get data and aggregate for each platform separately
    for (const [platform, postIds] of Object.entries(groupedByType)) {
      try {
        const platformData = await this.postRepository.getPostsByPids({
          platform: platform as AccountType,
          postIds,
          page: 1,
          pageSize: postIds.length,
        })

        // Calculate data summary for this platform
        const platformSummary = platformData.posts.reduce((
          acc: {
            viewCount: number
            commentCount: number
            likeCount: number
            shareCount: number
            clickCount: number
            impressionCount: number
            favoriteCount: number
          },
          post: {
            viewCount: number
            commentCount: number
            likeCount: number
            shareCount: number
            clickCount: number
            impressionCount: number
            favoriteCount: number
          },
        ) => {
          acc.viewCount += post.viewCount || 0
          acc.commentCount += post.commentCount || 0
          acc.likeCount += post.likeCount || 0
          acc.shareCount += post.shareCount || 0
          acc.clickCount += post.clickCount || 0
          acc.impressionCount += post.impressionCount || 0
          acc.favoriteCount += post.favoriteCount || 0
          return acc
        }, {
          viewCount: 0,
          commentCount: 0,
          likeCount: 0,
          shareCount: 0,
          clickCount: 0,
          impressionCount: 0,
          favoriteCount: 0,
        })

        // Add to total summary
        summary.totalViewCount += platformSummary.viewCount
        summary.totalCommentCount += platformSummary.commentCount
        summary.totalLikeCount += platformSummary.likeCount
        summary.totalShareCount += platformSummary.shareCount
        summary.totalClickCount += platformSummary.clickCount
        summary.totalImpressionCount += platformSummary.impressionCount
        summary.totalFavoriteCount += platformSummary.favoriteCount
        // Calculate the latest time in posts for this platform (prioritize updatedAt, then publishTime) and update global latest time
        const platformLatestTs = platformData.posts.reduce((max: number, post: { updatedAt: Date, publishTime: number }) => {
          const updatedTs = post.updatedAt ? new Date(post.updatedAt).getTime() : 0
          const publishTs = post.publishTime || 0
          const ts = Math.max(updatedTs, publishTs)
          return ts > max ? ts : max
        }, 0)
        summary.updatedAt = new Date(platformLatestTs)

        // Save detailed data for each platform
        summary.platformData[platform] = {
          postCount: platformData.posts.length,
          posts: platformData.posts,
          summary: platformSummary,
        }

        this.logger.debug(`${platform} platform statistics:`, platformSummary)
      }
      catch (error) {
        this.logger.error(`Failed to get ${platform} platform data:`, error)
      }
    }
    // this.logger.debug('Final summary result:', summary)
    return summary
  }

  /**
   * Query posts published on day 7 and day 30 relative to today by task ID
   * @param taskId Task ID
   * @returns Posts data for day 7 and day 30
   */
  async getTaskPostsByPublishDay(taskId: string) {
    // Get all task-related post records
    const taskPosts = await this.getTaskPostsByTaskId(taskId)

    if (!taskPosts || taskPosts.length === 0) {
      this.logger.debug(`Task ${taskId} has no post records`)
      return {
        day7Posts: [],
        day30Posts: [],
      }
    }

    // Group by platform and extract postId
    const groupedByType = taskPosts.reduce((acc, item) => {
      const type = item.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(item.postId)
      return acc
    }, {} as Record<string, string[]>)

    // Calculate UTC target date ranges (00:00:00 - 24:00:00 UTC)
    const now = new Date()
    const todayUtcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    const msPerDay = 24 * 60 * 60 * 1000

    const day7Start = new Date(todayUtcStart.getTime() - 7 * msPerDay)
    const day7End = new Date(day7Start.getTime() + msPerDay)

    const day30Start = new Date(todayUtcStart.getTime() - 30 * msPerDay)
    const day30End = new Date(day30Start.getTime() + msPerDay)

    this.logger.debug(`Query day 7 posts, UTC publish date range: ${day7Start.toISOString()} - ${day7End.toISOString()}`)
    this.logger.debug(`Query day 30 posts, UTC publish date range: ${day30Start.toISOString()} - ${day30End.toISOString()}`)

    const day7Posts: PostData[] = []
    const day30Posts: PostData[] = []

    // Get post details by platform and filter (batching by 100 postIds)
    const BATCH_SIZE = 100
    for (const [platform, postIds] of Object.entries(groupedByType)) {
      try {
        for (let start = 0; start < postIds.length; start += BATCH_SIZE) {
          const batchIds = postIds.slice(start, start + BATCH_SIZE)
          if (batchIds.length === 0)
            continue

          const platformData = await this.postRepository.getPostsByPids({
            platform: platform as AccountType,
            postIds: batchIds,
            page: 1,
            pageSize: batchIds.length,
          })

          // Filter day 7 posts (UTC window)
          const day7PostsFiltered = platformData.posts.filter((post: PostData) => {
            const publishTime = post.publishTime ? new Date(post.publishTime) : null
            if (!publishTime)
              return false
            return publishTime >= day7Start && publishTime < day7End
          })

          // Filter day 30 posts (UTC window)
          const day30PostsFiltered = platformData.posts.filter((post: PostData) => {
            const publishTime = post.publishTime ? new Date(post.publishTime) : null
            if (!publishTime)
              return false
            return publishTime >= day30Start && publishTime < day30End
          })

          day7Posts.push(...day7PostsFiltered)
          day30Posts.push(...day30PostsFiltered)
        }

        this.logger.debug(`${platform} platform - Day 7 posts: ${day7Posts.length}, Day 30 posts: ${day30Posts.length}`)
      }
      catch (error) {
        this.logger.error(`Failed to get ${platform} platform post data:`, error)
      }
    }

    const result = {
      day7Posts,
      day30Posts,
      summary: {
        day7Count: day7Posts.length,
        day30Count: day30Posts.length,
        totalCount: day7Posts.length + day30Posts.length,
      },
    }

    this.logger.debug(`Task ${taskId} - Day 7 posts: ${day7Posts.length}, Day 30 posts: ${day30Posts.length}`)

    return result
  }

  // Return posts for day7/day30 with post ownership mapping (postId -> accountId/platform/userId)
  // Note: Each postId should belong to only ONE user per task
  async getTaskPostsByPublishDayWithOwnership(taskId: string): Promise<{
    day7Posts: PostData[]
    day30Posts: PostData[]
    postIdToAccount: Map<string, { accountId?: string, platform?: AccountType, userId?: string }>
  }> {
    const taskPosts = await this.getTaskPostsByTaskId(taskId)

    interface PostOwnership { accountId?: string, platform?: AccountType, userId?: string }
    const postIdToAccount = new Map<string, PostOwnership>()

    // Build postId -> ownership mapping
    for (const it of taskPosts as Array<{ postId: string, type: AccountType } & Partial<PostOwnership>>) {
      if (postIdToAccount.has(it.postId)) {
        this.logger.warn(`Duplicate postId detected: ${it.postId} in task ${taskId}. Using first occurrence.`)
        continue
      }
      postIdToAccount.set(it.postId, { accountId: it.accountId, platform: it.type, userId: it.userId })
    }

    const { day7Posts, day30Posts } = await this.getTaskPostsByPublishDay(taskId)
    return { day7Posts, day30Posts, postIdToAccount }
  }
}

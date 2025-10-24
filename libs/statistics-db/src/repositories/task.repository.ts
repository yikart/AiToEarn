import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import { Connection, Model } from 'mongoose'
import { AccountType, UserTaskPosts } from '../schemas'
import { BaseRepository } from './base.repository'
import { PostRepository } from './post.repository'

@Injectable()
export class TaskRepository extends BaseRepository<UserTaskPosts> implements OnModuleInit {
  private readonly logger = new Logger(TaskRepository.name)

  constructor(
    @InjectConnection('statistics-db-connection') private readonly connection: Connection,
    private readonly postRepository: PostRepository,
  ) {
    super(null as any) // 临时使用null，稍后会设置正确的模型
  }

  async onModuleInit() {
    // 等待数据库连接建立
    await this.waitForConnection()
  }

  /**
   * 获取UserTaskPosts模型
   */
  private getUserTaskPostsModel(): Model<UserTaskPosts> {
    return this.connection.model(UserTaskPosts.name) as Model<UserTaskPosts>
  }

  /**
   * 等待数据库连接建立
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
      this.logger.log(`等待数据库连接... (${attempt}/${maxAttempts}) - 状态: ${states[currentState as keyof typeof states]} (${currentState})`)

      if (currentState === 1) {
        this.logger.log('数据库连接已建立')
        return
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    this.logger.error('数据库连接超时')
  }

  // 用户任务作品记录
  async userTaskPosts(accountId: string, type: AccountType, uid: string, taskId: string, postId: string) {
    const result = await this.getUserTaskPostsModel().create({ accountId, type, uid, taskId, postId, createdAt: new Date() })
    this.logger.debug(`PostDataIncrease result: ${JSON.stringify(result)}`)
    return result
  }

  // 根据taskId 查询 作品信息
  async getTaskPostsByTaskId(taskId: string) {
    const result = await this.getUserTaskPostsModel().find({ taskId })
    this.logger.debug(`TaskPostsByTaskId result: ${JSON.stringify(result)}`)
    return result
  }

  /**
   * 根据任务ID获取作品数据并汇总统计
   * @param taskId 任务ID
   * @returns 汇总统计结果
   */
  async getTaskPostsSummary(taskId: string) {
    const TaskPosts = await this.getTaskPostsByTaskId(taskId)
    this.logger.debug('TaskPosts:', TaskPosts)

    // 按 type 分组，提取各平台的 postId 数组
    const groupedByType = TaskPosts.reduce((acc, item) => {
      const type = item.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(item.postId)
      return acc
    }, {} as Record<string, string[]>)

    this.logger.debug('按类型分组:', groupedByType)

    // 初始化汇总结果
    const summary = {
      taskPosts: TaskPosts, // 原始 TaskPosts 数组
      platformData: {} as Record<string, unknown>, // 各平台详细数据
      totalViewCount: 0,
      totalCommentCount: 0,
      totalLikeCount: 0,
      totalShareCount: 0,
      totalClickCount: 0,
      totalImpressionCount: 0,
      totalFavoriteCount: 0,
      updatedAt: new Date(),
    }

    // 按平台分别获取数据并汇总
    for (const [platform, postIds] of Object.entries(groupedByType)) {
      try {
        const platformData = await this.postRepository.getPostsByPids({
          platform: platform as AccountType,
          postIds,
          page: 1,
          pageSize: postIds.length,
        })

        // 计算该平台的数据汇总
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

        // 累加到总汇总
        summary.totalViewCount += platformSummary.viewCount
        summary.totalCommentCount += platformSummary.commentCount
        summary.totalLikeCount += platformSummary.likeCount
        summary.totalShareCount += platformSummary.shareCount
        summary.totalClickCount += platformSummary.clickCount
        summary.totalImpressionCount += platformSummary.impressionCount
        summary.totalFavoriteCount += platformSummary.favoriteCount
        // 计算本平台 posts 中的最新时间（优先使用 updatedAt，其次使用 publishTime）并更新全局最新时间
        const platformLatestTs = platformData.posts.reduce((max: number, post: { updatedAt: Date, publishTime: number }) => {
          const updatedTs = post.updatedAt ? new Date(post.updatedAt).getTime() : 0
          const publishTs = post.publishTime || 0
          const ts = Math.max(updatedTs, publishTs)
          return ts > max ? ts : max
        }, 0)
        summary.updatedAt = new Date(platformLatestTs)

        // 保存各平台详细数据
        summary.platformData[platform] = {
          postCount: platformData.posts.length,
          posts: platformData.posts,
          summary: platformSummary,
        }

        this.logger.debug(`${platform} 平台统计:`, platformSummary)
      }
      catch (error) {
        this.logger.error(`获取 ${platform} 平台数据失败:`, error)
      }
    }
    // this.logger.debug('最终汇总结果:', summary)
    return summary
  }
}

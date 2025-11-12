import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Connection, Model } from 'mongoose'
import { AuthorDatas, ChannelCookie, ChannelsCrawl, JobTaskStatus, NewChannel } from '../schemas/account.schema'
import { PostsRecord, PostsRecordStatus } from '../schemas/posts.schema'
import { BaseRepository } from './base.repository'

interface HistoryPostsRecordItem {
  userId: string
  platform: AccountType
  uid: string
  postId: string
  accountId?: string
  title?: string
  desc?: string
  cover?: string
  publishTime?: Date
  // 新增字段用于存储详情数据
  mediaType?: string
  url?: string
  viewCount?: number
  commentCount?: number
  likeCount?: number
  shareCount?: number
  favoriteCount?: number
}

@Injectable()
export class ChannelRepository extends BaseRepository<PostsRecord> implements OnModuleInit {
  private readonly logger = new Logger(ChannelRepository.name)

  constructor(
    @InjectConnection('statistics-db-connection') private readonly connection: Connection,
  ) {
    super(null as any) // 临时使用null，稍后会设置正确的模型
  }

  async onModuleInit() {
    // 等待数据库连接建立
    await this.waitForConnection()
  }

  /**
   * 获取PostsRecord模型
   */
  private getPostsRecordModel(): Model<PostsRecord> {
    return this.connection.model('PostHistoryRecord') as Model<PostsRecord>
  }

  /**
   * 获取ChannelCookie模型
   */
  private getChannelCookieModel(): Model<ChannelCookie> {
    return this.connection.model('ChannelCookie') as Model<ChannelCookie>
  }

  /**
   * 获取NewChannel模型
   */
  private getNewChannelModel(): Model<NewChannel> {
    return this.connection.model('NewChannel') as Model<NewChannel>
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

  /**
   * 获取数据库连接状态
   */
  async getConnectionState(): Promise<number> {
    return this.connection.readyState
  }

  /**
   * 调试方法：获取集合信息
   */
  async getCollectionInfo(platform: string) {
    const model = this.getModelByPlatform(platform)
    const collectionName = model.collection.name
    const dbName = this.connection.db?.databaseName

    this.logger.log(`数据库: ${dbName}`)
    this.logger.log(`集合名称: ${collectionName}`)
    this.logger.log(`模型名称: ${model.modelName}`)

    return {
      database: dbName,
      collection: collectionName,
      modelName: model.modelName,
      connectionState: this.connection.readyState,
    }
  }

  /**
   * 带重试的数据库操作
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      }
      catch (error: unknown) {
        const e = error as Error
        this.logger.warn(`数据库操作失败，尝试 ${attempt}/${maxRetries}:`, e.message)

        if (attempt === maxRetries) {
          throw error
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
    throw new Error('所有重试都失败了')
  }

  /**
   * 根据平台 选择不同的集合
   */
  getModelByPlatform(platform: string): Model<AuthorDatas> {
    // 根据平台名称格式化模型名称
    let formattedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1)

    // 特殊处理各个平台名称
    if (platform === 'douyin') {
      formattedPlatform = 'DouYin'
    }
    else if (platform === 'wxGzh') {
      formattedPlatform = 'Gzh'
    }
    else if (platform === 'wxSph') {
      formattedPlatform = 'Sph'
    }
    else if (platform === 'facebook') {
      formattedPlatform = 'FaceBook'
    }
    else if (platform === 'xhs') {
      formattedPlatform = 'Xhs'
    }
    else if (platform === 'threads') {
      formattedPlatform = 'Threads'
    }
    else if (platform === 'linkedin') {
      formattedPlatform = 'LinkedIn'
    }
    else if (platform === 'instagram') {
      formattedPlatform = 'Instagram'
    }
    else if (platform === 'tiktok') {
      formattedPlatform = 'Tiktok'
    }
    else if (platform === 'twitter') {
      formattedPlatform = 'Twitter'
    }
    else if (platform === 'pinterest') {
      formattedPlatform = 'Pinterest'
    }
    else if (platform === 'youtube') {
      formattedPlatform = 'Youtube'
    }
    else if (platform === 'KWAI') {
      formattedPlatform = 'Kwai'
    }
    else if (platform === 'bilibili') {
      formattedPlatform = 'Bilibili'
    }

    const modelName = `${formattedPlatform}AuthorDayDatas`
    return this.connection.model(modelName) as Model<AuthorDatas>
  }

  /**
   * 用户选择历史发布记录，记录后发送到草稿箱
   * @param records 历史发布记录数组
   */
  async historyPostsRecord(records: HistoryPostsRecordItem[]) {
    const bulkOps = records.map((record) => {
      // Add post detail

      const newData = {
        accountId: record.accountId,
        userId: record.userId,
        platform: record.platform,
        uid: record.uid,
        postId: record.postId,
        status: PostsRecordStatus.Pending,
        createdAt: new Date(),
        updatedAt: new Date(),
        title: record.title || '',
        desc: record.desc || '',
        cover: record.cover || '',
        publishTime: record.publishTime ? new Date(record.publishTime) : new Date(),
        // 添加详情数据中的其他字段
        mediaType: record.mediaType || '',
        url: record.url || '',
        viewCount: record.viewCount || 0,
        commentCount: record.commentCount || 0,
        likeCount: record.likeCount || 0,
        shareCount: record.shareCount || 0,
        favoriteCount: record.favoriteCount || 0,
      }

      return {
        updateOne: {
          filter: {
            userId: record.userId,
            platform: record.platform,
            uid: record.uid,
            postId: record.postId,
          },
          update: { $set: newData },
          upsert: true,
        },
      }
    })

    const result = await this.getPostsRecordModel().bulkWrite(bulkOps)
    this.logger.debug(`historyPostsRecord bulk update result: ${JSON.stringify(result)}`)
    return result
  }

  /**
   * query history add to draft status
   * @param userId
   */
  async historyPostsRecordStatus(userId: string) {
    const result = await this.getPostsRecordModel().find(
      { userId },
    )
    this.logger.debug(`query history posts add to draft status result: ${JSON.stringify(result)}`)
    return result
  }

  /**
   * 最近一个月平均数据
   * @param _platform
   * @param _uid
   */
  async averageDataMonthly(_platform: AccountType, _uid: string) {
  }

  /**
   * get channel cookie
   * @param platform
   */
  async getChannelCookieByPlatform(platform: string) {
    try {
      const result = await this.getChannelCookieModel().findOne({ platform }).exec()
      return result
    }
    catch (error) {
      this.logger.error(`Failed to get channel cookie for platform ${platform}:`, error)
      throw error
    }
  }

  /**
   * Submit channel for crawling
   * @param data Platform, uid, timestamps and status
   * @param data.platform Platform type
   * @param data.uid Channel UID
   * @param data.createAt Initial created time (UTC)
   * @param data.updateAt Update time (UTC)
   * @param data.status Task status
   */
  async submitChannelCrawling(data: { platform: AccountType, uid: string, createAt: Date, updateAt: Date, status: JobTaskStatus }) {
    try {
      // Use ChannelsCrawling model to enable mongoose validation
      const ChannelsCrawlingModel = this.connection.model('ChannelsCrawling') as Model<ChannelsCrawl>

      // 10-minute rate limit logic (compare UTC Date)
      const existing = await ChannelsCrawlingModel.findOne({ platform: data.platform, uid: data.uid })
        .select({ updatedAt: 1 })
        .lean()

      const now = new Date()
      if (existing?.updatedAt) {
        const last = new Date(existing.updatedAt as unknown as string)
        const diffMs = now.getTime() - last.getTime()
        const tenMinutesMs = 10 * 60 * 1000
        if (diffMs < tenMinutesMs) {
          const nextAllowedAt = new Date(last.getTime() + tenMinutesMs)
          return {
            success: false,
            limited: true,
            platform: data.platform,
            uid: data.uid,
            updatedAt: existing.updatedAt,
            nextAllowedAt,
          }
        }
      }

      // Insert new record only (no update)
      const newRecord = await ChannelsCrawlingModel.create({
        platform: data.platform,
        uid: data.uid,
        status: data.status,
      })

      this.logger.log(`Submitted channel for crawling: platform=${data.platform}, uid=${data.uid}, id=${newRecord._id}`)

      return {
        success: true,
        platform: data.platform,
        uid: data.uid,
        status: data.status,
        createdAt: newRecord.createdAt,
        updatedAt: newRecord.updatedAt,
        isNew: true,
        id: newRecord._id.toString(),
      }
    }
    catch (error) {
      this.logger.error(`Failed to submit channel for crawling: ${(error as Error).message}`)
      throw error
    }
  }

  /**
   * new channel report
   */
  async setNewChannels(platform: string, uid: string) {
    return this.executeWithRetry(async () => {
      const newData = { type: platform, uid, status: JobTaskStatus.Pending }
      const result = await this.getNewChannelModel().updateOne({ type: platform, uid }, { $set: newData }, { upsert: true })
      this.logger.debug(`setNewChannels result: ${JSON.stringify(result)}`)
      return result
    })
  }
}

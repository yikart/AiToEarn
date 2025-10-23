import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectConnection, InjectModel } from '@nestjs/mongoose'
import { Connection, Model } from 'mongoose'
import { AccountType, ChannelCookie } from '../schemas/account.schema'
import { AuthorDatas } from '../schemas/authorData.schema'
import { PostsRecord, PostsRecordStatus } from '../schemas/posts.schema'
import { BaseRepository } from './base.repository'

interface HistoryPostsRecordItem {
  userId: string
  platform: AccountType
  uid: string
  postId: string
  accountId?: string
}

@Injectable()
export class ChannelRepository extends BaseRepository<PostsRecord> implements OnModuleInit {
  private readonly logger = new Logger(ChannelRepository.name)

  constructor(
    @InjectModel('BilibiliAuthorDatas')
    private readonly BilibiliAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('DouYinAuthorDatas')
    private readonly DouYinAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('FaceBookAuthorDatas')
    private readonly FaceBookAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('GzhAuthorDatas')
    private readonly GzhAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('InstagramAuthorDatas')
    private readonly InstagramAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('KwaiAuthorDatas')
    private readonly KwaiAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('PinterestAuthorDatas')
    private readonly PinterestAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('ThreadsAuthorDatas')
    private readonly ThreadsAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('TiktokAuthorDatas')
    private readonly TiktokAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('TwitterAuthorDatas')
    private readonly TwitterAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('XhsAuthorDatas')
    private readonly XhsAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('YoutubeAuthorDatas')
    private readonly YoutubeAuthorDatasModel: Model<AuthorDatas>,
    @InjectModel('PostsRecord') // posts history record
    private readonly PostsRecordModel: Model<PostsRecord>,
    @InjectModel('ChannelCookie')
    private readonly ChannelCookieModel: Model<ChannelCookie>,

    @InjectConnection() private readonly connection: Connection,
  ) {
    super(PostsRecordModel)
  }

  async onModuleInit() {
    // 等待数据库连接建立
    await this.waitForConnection()
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
   * 根据平台 选择不同的集合
   */
  getModelByPlatform(platform: string): Model<AuthorDatas> {
    switch (platform) {
      case 'bilibili':
        return this.BilibiliAuthorDatasModel
      case 'douyin':
        return this.DouYinAuthorDatasModel
      case 'xhs':
        return this.XhsAuthorDatasModel
      case 'KWAI':
        return this.KwaiAuthorDatasModel
      case 'youtube':
        return this.YoutubeAuthorDatasModel
      case 'wxGzh':
        return this.GzhAuthorDatasModel
      case 'twitter':
        return this.TwitterAuthorDatasModel
      case 'tiktok':
        return this.TiktokAuthorDatasModel
      case 'facebook':
        return this.FaceBookAuthorDatasModel
      case 'instagram':
        return this.InstagramAuthorDatasModel
      case 'threads':
        return this.ThreadsAuthorDatasModel
      case 'pinterest':
        return this.PinterestAuthorDatasModel
      // 其他平台...
      default:
        throw new Error('不支持的平台')
    }
  }

  /**
   * 用户选择历史发布记录，记录后发送到草稿箱
   * @param records 历史发布记录数组
   */
  async historyPostsRecord(records: HistoryPostsRecordItem[]) {
    const bulkOps = records.map((record) => {
      const newData = {
        accountId: record.accountId,
        userId: record.userId,
        platform: record.platform,
        uid: record.uid,
        postId: record.postId,
        status: PostsRecordStatus.Pending,
        createdAt: new Date(),
        updatedAt: new Date(),
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

    const result = await this.PostsRecordModel.bulkWrite(bulkOps)
    this.logger.debug(`historyPostsRecord bulk update result: ${JSON.stringify(result)}`)
    return result
  }

  /**
   * query history add to draft status
   * @param userId
   */
  async historyPostsRecordStatus(userId: string) {
    const result = await this.PostsRecordModel.find(
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
   * 根据平台获取渠道cookie
   * @param platform
   */
  async getChannelCookieByPlatform(platform: string) {
    try {
      const result = await this.ChannelCookieModel.findOne({ platform }).exec()
      return result
    }
    catch (error) {
      this.logger.error(`Failed to get channel cookie for platform ${platform}:`, error)
      throw error
    }
  }
}

import type { StatisticsDbConfig } from './statistics-db.config'
import { Global } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { repositories } from './repositories'
import { schemas } from './schemas'
import { ChannelsCrawlSchema } from './schemas/account.schema'
import { AuthorDatasSchema } from './schemas/authorData.schema'
import { PostDatasSchema, PostsRecordSchema } from './schemas/posts.schema'
import { UserTaskPostsSchema } from './schemas/task.schema'
import { TransactionalInjector } from './transactional.injector'

mongoose.set('transactionAsyncLocalStorage', true)

@Global()
export class StatisticsDbModule {
  static forRoot(config: StatisticsDbConfig) {
    const platforms = [
      'bilibili',
      'douyin',
      'facebook',
      'wxGzh',
      'wxSph',
      'instagram',
      'KWAI',
      'pinterest',
      'threads',
      'tiktok',
      'twitter',
      'xhs',
      'youtube',
      'linkedin',
    ]

    // 创建作者数据模型定义
    const authorDayDataCollections = platforms.map((platform) => {
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
      const collection = {
        name: modelName,
        schema: AuthorDatasSchema,
        collection: `${platform.toLowerCase()}_account_insights_snapshot`,
      }
      return collection
    })

    // 创建PostRepository使用的模型定义
    const postDayDataCollections = platforms.map((platform) => {
      const collection = {
        name: `${platform.toLowerCase()}_insights`,
        schema: PostDatasSchema,
        collection: `${platform.toLowerCase()}_post_insights_snapshot`,
      }
      return collection
    })

    // 添加增量数据模型定义
    const increaseDataCollections = [
      { name: 'AccountDayIncrease', schema: PostDatasSchema, collection: 'account_daily_insights_delta' },
      { name: 'PostDayIncrease', schema: PostDatasSchema, collection: 'post_daily_insights_delta' },
    ]

    // 添加其他模型定义
    const otherDataCollections = [
      { name: 'UserTaskPosts', schema: UserTaskPostsSchema, collection: 'user_tasks_posts' },
      { name: 'PostHistoryRecord', schema: PostsRecordSchema, collection: 'posts_history_record' },
      { name: 'ChannelsCrawling', schema: ChannelsCrawlSchema, collection: 'channels_with_crawling' },
    ]

    // 创建PostRepository使用的模型定义
    const postDataCollections = platforms.map((platform) => {
      // 根据PostRepository中的注入名称进行匹配
      const modelName = `${platform.toLowerCase()}_snapshot`
      const collection = {
        name: modelName,
        schema: PostDatasSchema,
        collection: `${platform.toLowerCase()}_post_snapshot`,
      }
      return collection
    })

    const { uri, dbName, ...options } = config

    // 添加连接验证
    const connectionOptions = {
      ...options,
      dbName: dbName || 'aitoearn_datas',
      connectionName: 'statistics-db-connection',
    }

    const forFeature = MongooseModule.forFeature([
      ...schemas,
      ...authorDayDataCollections,
      ...postDayDataCollections,
      ...postDataCollections,
      ...increaseDataCollections,
      ...otherDataCollections,
    ], 'statistics-db-connection')

    return {
      module: StatisticsDbModule,
      imports: [
        MongooseModule.forRoot(uri, connectionOptions),
        forFeature,
      ],
      providers: [
        ...repositories,
        TransactionalInjector,
      ],
      exports: [
        forFeature,
        ...repositories,
      ],
    }
  }
}

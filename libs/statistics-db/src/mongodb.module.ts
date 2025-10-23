import type { MongodbConfig } from './mongodb.config'
import { Global } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import mongoose, { Collection } from 'mongoose'
import { repositories } from './repositories'
import { schemas } from './schemas'
import { PostDatasSchema } from './schemas/authorData.schema'
import { TransactionalInjector } from './transactional.injector'

mongoose.set('transactionAsyncLocalStorage', true)

@Global()
export class StatisticsDbModule {
  static forRoot(config: MongodbConfig) {
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
    const authorDataCollections = platforms.map((platform) => {
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

      const modelName = `${formattedPlatform}AuthorDatas`
      const collection = {
        name: modelName,
        schema: PostDatasSchema,
      }
      return collection
    })

    // 创建PostRepository使用的模型定义
    const postDataCollections = platforms.map((platform) => {
      let modelName
      // 根据PostRepository中的注入名称进行匹配
      if (platform === 'bilibili') {
        modelName = 'bilibili'
      }
      else if (platform === 'douyin') {
        modelName = 'douyin'
      }
      else if (platform === 'facebook') {
        modelName = 'facebook'
      }
      else if (platform === 'wxGzh') {
        modelName = 'wxgzh'
      }
      else if (platform === 'wxSph') {
        modelName = 'wxsph'
      }
      else {
        // 其他平台使用小写名称
        modelName = platform.toLowerCase()
      }

      const collection = {
        name: modelName,
        schema: PostDatasSchema,
      }
      return collection
    })

    // 添加增量数据模型定义
    const increaseDataCollections = [
      { name: 'AccountDayIncrease', schema: PostDatasSchema },
      { name: 'PostDayIncrease', schema: PostDatasSchema, collection: 'post_daily_insights_delta' },
    ]

    const forFeature = MongooseModule.forFeature([
      ...schemas,
      ...authorDataCollections,
      ...postDataCollections,
      ...increaseDataCollections,
    ])
    const { uri, ...options } = config

    return {
      imports: [
        MongooseModule.forRoot(uri, options),
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
      module: StatisticsDbModule,
      global: true,
    }
  }
}

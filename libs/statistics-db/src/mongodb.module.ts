import type { MongodbConfig } from './mongodb.config'
import { Global } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import mongoose from 'mongoose'
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
    const collections = platforms.map((platform) => {
      const modelName = platform.toLocaleLowerCase()
      const collection = { name: `${modelName}`, schema: PostDatasSchema, collection: `${modelName}_post_snapshot` }
      return collection
    })

    const forFeature = MongooseModule.forFeature([...schemas, ...collections])
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

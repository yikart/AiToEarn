import type { MongodbConfig } from './mongodb.config'
/*
 * @Author: nevin
 * @Date: 2022-09-23 18:00:51
 * @LastEditTime: 2025-01-15 14:20:46
 * @LastEditors: nevin
 * @Description:
 */
import { Global } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { repositories } from './repositories'
import { schemas } from './schemas'

mongoose.set('transactionAsyncLocalStorage', true)

@Global()
export class MongodbModule {
  static forRoot(config: MongodbConfig) {
    const forFeature = MongooseModule.forFeature([...schemas])
    const { uri, ...options } = config

    return {
      imports: [
        MongooseModule.forRoot(uri, options),
        forFeature,
      ],
      providers: [...repositories],
      exports: [forFeature, ...repositories],
      module: MongodbModule,
      global: true,
    }
  }
}

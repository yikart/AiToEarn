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
import {
  BrowserEnvironment,
  BrowserEnvironmentSchema,
  BrowserProfile,
  BrowserProfileSchema,
  MultiloginAccounts,
  MultiloginAccountSchema,
  PointsRecord,
  PointsRecordSchema,
  User,
  UserSchema,
} from './schemas'

mongoose.set('transactionAsyncLocalStorage', true)

@Global()
export class MongodbModule {
  static forRoot(config: MongodbConfig) {
    const forFeature = MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PointsRecord.name, schema: PointsRecordSchema },
      { name: BrowserEnvironment.name, schema: BrowserEnvironmentSchema },
      { name: BrowserProfile.name, schema: BrowserProfileSchema },
      { name: MultiloginAccounts.name, schema: MultiloginAccountSchema },
    ])

    return {
      imports: [
        MongooseModule.forRoot(config.uri, config),
        forFeature,
      ],
      providers: [],
      exports: [forFeature],
      module: MongodbModule,
      global: true,
    }
  }
}

/*
 * @Author: nevin
 * @Date: 2022-09-23 18:00:51
 * @LastEditTime: 2025-01-15 14:20:46
 * @LastEditors: nevin
 * @Description:
 */
import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { config } from '@/config'
import { Id, IdSchema } from './id.schema'
import { IdService } from './id.service'

mongoose.set('transactionAsyncLocalStorage', true)

@Global()
@Module({
  imports: [
    MongooseModule.forRoot(config.mongodb.uri, {
      dbName: config.mongodb.dbName,
      // autoIndex: true,
      // autoCreate: true,
    }),
    MongooseModule.forFeature([
      // 挂载实体
      { name: Id.name, schema: IdSchema },
    ]),
  ],
  providers: [IdService],
  exports: [IdService],
})
export class DbMongoModule { }

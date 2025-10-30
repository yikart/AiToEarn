import type { MongodbConfig } from './mongodb.config'
import { Global } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { repositories } from './repositories'
import { schemas } from './schemas'
import { TransactionalInjector } from './transactional.injector'

mongoose.set('transactionAsyncLocalStorage', true)

@Global()
export class TaskDbModule {
  static forRoot(config: MongodbConfig) {
    const forFeature = MongooseModule.forFeature([...schemas])
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
      module: TaskDbModule,
      global: true,
    }
  }
}

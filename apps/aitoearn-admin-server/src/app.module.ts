import { Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { RedisModule } from '@yikart/redis'
import { StatisticsDbModule } from '@yikart/statistics-db'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { config } from './config'
import { CoreModule } from './core/core.module'
import { TransportsModule } from './transports/transports.module'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    StatisticsDbModule.forRoot(config.statisticsDb),
    RedisModule.forRoot(config.redis),
    TransportsModule,
    CoreModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
  ],
})
export class AppModule { }

import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { StatisticsDbModule } from '@yikart/statistics-db'
import { config } from '../config'
import { AccountDataModule } from './accountData/accountData.module'
import { ChannelModule } from './channel/channel.module'
import { PostModule } from './post/post.module'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { TaskModule } from './task/task.module'

@Global()
@Module({
  imports: [
    HttpModule,
    StatisticsDbModule.forRoot(config.statisticsDb),
    ChannelModule,
    AccountDataModule,
    PostModule,
    TaskModule,
  ],
  providers: [StatisticsService],
  controllers: [StatisticsController],
  exports: [StatisticsService],
})
export class StatisticsModule {}

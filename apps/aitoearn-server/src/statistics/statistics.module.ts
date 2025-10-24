import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { StatisticsDbModule } from '@yikart/statistics-db'
import { config } from '../config'
import { ChannelModule } from './channel/channel.module'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'

@Global()
@Module({
  imports: [
    HttpModule,
    StatisticsDbModule.forRoot(config.statisticsDb),
    ChannelModule,
  ],
  providers: [StatisticsService],
  controllers: [StatisticsController],
  exports: [StatisticsService],
})
export class StatisticsModule {}

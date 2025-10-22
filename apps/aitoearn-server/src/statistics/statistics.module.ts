import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { StatisticsDbModule } from '@yikart/statistics-db'
import { config } from '../config'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'

@Global()
@Module({
  imports: [HttpModule, StatisticsDbModule.forRoot(config.statisticsDb)],
  providers: [StatisticsService],
  controllers: [StatisticsController],
  exports: [StatisticsService],
})
export class StatisticsModule {}

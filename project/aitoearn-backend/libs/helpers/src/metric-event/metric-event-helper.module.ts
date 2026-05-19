import { Module } from '@nestjs/common'
import { MetricEventHelperService } from './metric-event-helper.service'

@Module({
  providers: [MetricEventHelperService],
  exports: [MetricEventHelperService],
})
export class MetricEventHelperModule {}

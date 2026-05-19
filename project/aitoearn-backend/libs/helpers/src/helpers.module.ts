import { Global, Module } from '@nestjs/common'
import { CreditsHelperModule } from './credits/credits-helper.module'
import { MetricEventHelperModule } from './metric-event/metric-event-helper.module'

@Global()
@Module({
  imports: [CreditsHelperModule, MetricEventHelperModule],
  exports: [CreditsHelperModule, MetricEventHelperModule],
})
export class HelpersModule {}

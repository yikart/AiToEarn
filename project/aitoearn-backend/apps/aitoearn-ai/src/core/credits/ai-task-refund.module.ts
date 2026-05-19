import { Module } from '@nestjs/common'
import { HelpersModule } from '@yikart/helpers'
import { SettlementModule } from '../ai/settlement'
import { AiTaskRefundConsumer } from './ai-task-refund.consumer'

@Module({
  imports: [HelpersModule, SettlementModule],
  providers: [AiTaskRefundConsumer],
})
export class AiTaskRefundModule {}

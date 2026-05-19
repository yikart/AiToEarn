import { Module } from '@nestjs/common'
import { config } from '../../../../config'
import { DashscopeModule } from '../../libs/dashscope'
import { ModelsConfigModule } from '../../models-config'
import { SettlementModule } from '../../settlement'
import { DashscopeVideoService } from './dashscope.service'

@Module({
  imports: [
    DashscopeModule.forRoot(config.ai.dashscope),
    ModelsConfigModule,
    SettlementModule,
  ],
  providers: [DashscopeVideoService],
  exports: [DashscopeVideoService],
})
export class DashscopeVideoModule {}

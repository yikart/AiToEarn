import { Module } from '@nestjs/common'
import { ModelsConfigModule } from '../../models-config'
import { SettlementModule } from '../../settlement'
import { MiniMaxVideoService } from './minimax.service'

@Module({
  imports: [
    ModelsConfigModule,
    SettlementModule,
  ],
  providers: [MiniMaxVideoService],
  exports: [MiniMaxVideoService],
})
export class MiniMaxVideoModule {}

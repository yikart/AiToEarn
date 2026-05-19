import { Module } from '@nestjs/common'
import { InteracteModule } from './interact.module'
import { InteractionMcpService } from './interaction-mcp.service'
import { InteractionMcpController } from './interaction.mcp.controller'

@Module({
  imports: [InteracteModule],
  providers: [InteractionMcpController, InteractionMcpService],
  exports: [InteractionMcpController, InteractionMcpService],
})
export class InteractionMcpModule {}

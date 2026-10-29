import { Module } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { McpModule } from '@yikart/nest-mcp'
import { AgentGuardModule } from '../../agent/agent-guard.module'
import { ChannelsModule } from '../channels.module'
import { ChannelsMcpController } from './channels.mcp.controller'
import { ChannelsMcpService } from './channels.mcp.service'

@Module({
  imports: [
    McpModule.forRoot({
      name: 'channels',
      version: '1.0.0',
      apiPrefix: 'channels',
      decorators: [ApiTags('MCP/Channels')],
    }),
    AgentGuardModule,
    ChannelsModule,
  ],
  providers: [ChannelsMcpController, ChannelsMcpService],
  exports: [ChannelsMcpController, ChannelsMcpService],
})
export class ChannelsMcpModule {}

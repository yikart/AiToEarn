import { Module } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { McpModule } from '@yikart/nest-mcp'
import { ChannelsModule } from '../channels/channels.module'
import { ChannelsMcpModule } from '../channels/mcp/channels.mcp.module'
import { ContentMcpController } from '../content/content.mcp.controller'
import { ContentModule } from '../content/content.module'
import { DraftGenerationMcpController } from './draft-generation.mcp.controller'

@Module({
  imports: [
    McpModule.forRoot({
      name: 'aitoearn',
      version: '1.0.0',
      apiPrefix: 'unified',
      decorators: [ApiTags('MCP/Unified')],
    }),
    ChannelsModule,
    ChannelsMcpModule,
    ContentModule,
  ],
  providers: [
    ContentMcpController,
    DraftGenerationMcpController,
  ],
})
export class UnifiedMcpModule {}

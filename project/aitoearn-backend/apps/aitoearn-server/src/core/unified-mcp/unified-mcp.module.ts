import { Module } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { MCP_TOOL_FILTER, McpModule } from '@yikart/nest-mcp'
import { AgentGuardModule } from '../agent/agent-guard.module'
import { agentCoreToolFilter } from '../agent/agent-tool-policy'
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
      // Agent 面工具预算（方案 §12.2）：tools/list 与 tools/call 只放行已实现契约的后端工具
      toolFilterProvider: {
        provide: MCP_TOOL_FILTER,
        useValue: { filterTools: agentCoreToolFilter },
      },
    }),
    AgentGuardModule,
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

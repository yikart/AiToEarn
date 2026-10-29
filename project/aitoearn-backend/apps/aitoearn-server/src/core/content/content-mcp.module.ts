import { Module } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { McpModule } from '@yikart/nest-mcp'
import { AgentGuardModule } from '../agent/agent-guard.module'
import { ContentMcpController } from './content.mcp.controller'
import { ContentModule } from './content.module'

@Module({
  imports: [
    ContentModule,
    AgentGuardModule,
    McpModule.forRoot({
      name: 'content',
      version: '1.0.0',
      apiPrefix: 'content',
      decorators: [ApiTags('MCP/Content')],
    }),
  ],
  providers: [ContentMcpController],
})
export class ContentMcpModule {}

import { Module } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { McpModule } from '@yikart/nest-mcp'
import { AccountMcpController } from '../account/account.mcp.controller'
import { AccountModule } from '../account/account.module'
import { PublishMcpController } from '../channel/publish.mcp.controller'
import { PublishModule as PublishingModule } from '../channel/publishing/publishing.module'
import { ContentMcpController } from '../content/content.mcp.controller'
import { ContentModule } from '../content/content.module'

@Module({
  imports: [
    McpModule.forRoot({
      name: 'aitoearn',
      version: '1.0.0',
      apiPrefix: 'unified',
      decorators: [ApiTags('MCP/Unified')],
    }),
    AccountModule,
    PublishingModule,
    ContentModule,
  ],
  providers: [
    AccountMcpController,
    PublishMcpController,
    ContentMcpController,
  ],
})
export class UnifiedMcpModule {}

import { Module } from '@nestjs/common'
import { McpModule as RekogMcpModule } from '@rekog/mcp-nest'
import { ApiKeyAuthGuard } from '../../common/guards/api-key.guard'
import { PublishingModule } from '../publishing/publishing.module'
import { PublishingService } from '../publishing/publishing.service'
import { PublishingTool } from './mcp.tools'

@Module({
  imports: [
    RekogMcpModule.forRoot({
      name: 'aitoearn-mcp',
      version: '1.0.0',
      guards: [ApiKeyAuthGuard],
    }),
    PublishingModule,
  ],
  controllers: [],
  providers: [PublishingService, PublishingTool],
  exports: [PublishingService, PublishingTool],
})
export class McpModule { }

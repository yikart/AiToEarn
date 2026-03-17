import { Module } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { McpModule } from '@yikart/nest-mcp'
import { AccountModule } from '../account/account.module'
import { PublishMcpController } from './publish.mcp.controller'
import { PublishModule as PublishingModule } from './publishing/publishing.module'

@Module({
  imports: [
    AccountModule,
    McpModule.forRoot({
      name: 'publish',
      version: '1.0.0',
      apiPrefix: 'publish',
      decorators: [ApiTags('MCP/Publish')],
    }),
    PublishingModule,
  ],
  providers: [PublishMcpController],
})
export class PublishMcpModule {}

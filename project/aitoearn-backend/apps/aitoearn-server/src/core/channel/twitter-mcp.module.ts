import { Module } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { McpModule } from '@yikart/nest-mcp'
import { TwitterModule } from './platforms/twitter/twitter.module'
import { TwitterMcpController } from './twitter.mcp.controller'

@Module({
  imports: [
    McpModule.forRoot({
      name: 'twitter',
      version: '1.0.0',
      apiPrefix: 'twitter',
      decorators: [ApiTags('MCP/Twitter')],
    }),
    TwitterModule,
  ],
  providers: [TwitterMcpController],
  exports: [TwitterMcpController],
})
export class TwitterMcpModule {}

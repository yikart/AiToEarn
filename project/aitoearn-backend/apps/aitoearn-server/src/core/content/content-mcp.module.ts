import { Module } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { McpModule } from '@yikart/nest-mcp'
import { ContentMcpController } from './content.mcp.controller'
import { ContentModule } from './content.module'

@Module({
  imports: [
    ContentModule,
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

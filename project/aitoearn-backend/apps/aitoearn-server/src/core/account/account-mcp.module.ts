import { Module } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { McpModule } from '@yikart/nest-mcp'
import { AccountMcpController } from './account.mcp.controller'
import { AccountModule } from './account.module'

@Module({
  imports: [
    AccountModule,
    McpModule.forRoot({
      name: 'account',
      version: '1.0.0',
      apiPrefix: 'account',
      decorators: [ApiTags('MCP/Account')],
    }),
  ],
  providers: [AccountMcpController],
})
export class AccountMcpModule {}

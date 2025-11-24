import { Module } from '@nestjs/common'
import { AccountModule } from '../account/account.module'
import { McpApiKeyController } from './mcp.controller'
import { McpService } from './mcp.service'

@Module({
  imports: [
    AccountModule,
  ],
  controllers: [
    McpApiKeyController,
  ],
  providers: [
    McpService,
  ],
  exports: [
    McpService,
  ],
})
export class McpModule {}

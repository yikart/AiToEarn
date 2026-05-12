import { Module } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { McpModule } from '@yikart/nest-mcp'
import { ChannelModule } from '../channel/channel.module'
import { EngagementModule } from '../channel/engagement/engagement.module'
import { TaskMcpController } from './task-mcp.controller'
import { AutoClaimTaskScheduler } from './auto-claim-task.scheduler'
import { UserModule } from '../user/user.module'
import { AccountModule } from '../account/account.module'

@Module({
  imports: [
    ChannelModule,
    UserModule,
    AccountModule,
    EngagementModule,
    McpModule.forRoot({
      name: 'task',
      version: '1.0.0',
      apiPrefix: 'task',
      decorators: [ApiTags('MCP/Task')],
    }),
  ],
  providers: [TaskMcpController, AutoClaimTaskScheduler],
})
export class TaskMcpModule {}
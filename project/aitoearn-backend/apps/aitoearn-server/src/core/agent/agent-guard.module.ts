import { Module } from '@nestjs/common'
import { DiscoveryModule } from '@nestjs/core'
import { AgentToolBudgetService } from './agent-tool-budget.service'
import { WriteConfirmService } from './write-confirm'

/** Agent 护栏：工具预算核对 + 写操作 dry-run 确认 */
@Module({
  imports: [DiscoveryModule],
  providers: [AgentToolBudgetService, WriteConfirmService],
  exports: [AgentToolBudgetService, WriteConfirmService],
})
export class AgentGuardModule {}

import { Global, Module } from '@nestjs/common'
import { AccountPortraitModule } from '../account-portrait/account-portrait.module'
import { TaskMatcherModule } from '../task-matcher/task-matcher.module'
import { AdminTaskOpportunityController } from './admin/adminTaskOpportunity.controller'
import { AdminTaskOpportunityService } from './admin/adminTaskOpportunity.service'
import { TaskAdminController } from './admin/task-admin.controller'
import { TaskAdminService } from './admin/task-admin.service'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'
import { TaskOpportunityController } from './taskOpportunity.controller'
import { TaskOpportunityService } from './taskOpportunity.service'

@Global()
@Module({
  imports: [
    AccountPortraitModule,
    TaskMatcherModule,
  ],
  controllers: [TaskController, TaskOpportunityController, TaskAdminController, AdminTaskOpportunityController],
  providers: [
    TaskService,
    TaskOpportunityService,
    TaskAdminService,
    AdminTaskOpportunityService,
  ],
  exports: [TaskService, TaskOpportunityService],
})
export class TaskModule { }

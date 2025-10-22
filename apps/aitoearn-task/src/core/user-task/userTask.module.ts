import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { AdminAuditProcessor } from './admin-audit.processor'
import { AdminUtilService } from './admin-util.service'
import { UserTaskAdminController } from './admin/user-task.controller'
import { UserTaskAdminService } from './admin/user-task.service'
import { UserTaskController } from './userTask.controller'
import { UserTaskService } from './userTask.service'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'bull_aotu_task_audit',
    }),
  ],
  controllers: [UserTaskController, UserTaskAdminController],
  providers: [UserTaskService, UserTaskAdminService, AdminUtilService, AdminAuditProcessor],
  exports: [UserTaskService, UserTaskAdminService],
})
export class UserTaskModule {}

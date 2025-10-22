import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { UserTaskAdminService } from './admin/user-task.service'

@Processor('bull_aotu_task_audit')
export class AdminAuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AdminAuditProcessor.name)

  constructor(readonly userTaskAdminService: UserTaskAdminService) {
    super()
  }

  async process(job: Job<{ userTaskId: string }>): Promise<any> {
    this.logger.log('----进入任务----bullTaskAudit:  自动审核任务开始执行----')

    const userTaskInfo = await this.userTaskAdminService.getUserTaskInfoById(
      job.data.userTaskId,
    )
    if (!userTaskInfo)
      return

    const { status, message, retry, data }
      = await this.userTaskAdminService.autoAuditTask(job.data.userTaskId)

    this.userTaskAdminService.updateUserTaskAutoStatus(job.data.userTaskId, {
      status,
      message,
    })

    if (retry)
      return job.retry()

    // 根据审核状态确定是否通过
    if (data) {
      this.userTaskAdminService.verifyUserTaskApproved(userTaskInfo, {})
    }
    else {
      this.userTaskAdminService.verifyUserTaskRejected(userTaskInfo, {
        verificationNote: `机器自动审核---${message}`,
      })
    }
  }
}

/*
 * @Author: nevin
 * @Date: 2024-07-03 15:16:12
 * @LastEditTime: 2025-02-10 17:18:50
 * @LastEditors: nevin
 * @Description: 任务自动审核队列
 */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AdminUserTaskService } from './adminUserTask.service';

@Processor('bull_aotu_task_audit')
export class BullTaskAuditProcessor extends WorkerHost {
  constructor(readonly adminUserTaskService: AdminUserTaskService) {
    super();
  }

  async process(job: Job<{ userTaskId: string }>): Promise<any> {
    console.log('----进入任务----bullTaskAudit:  自动审核任务开始执行----');

    const userTaskInfo = await this.adminUserTaskService.getUserTaskInfoById(
      job.data.userTaskId,
    );
    if (!userTaskInfo) return;

    const { status, message, retry, data } =
      await this.adminUserTaskService.autoAuditTask(job.data.userTaskId);

    this.adminUserTaskService.updateUserTaskAutoStatus(job.data.userTaskId, {
      status,
      message,
    });

    if (retry) return job.retry();

    // 根据审核状态确定是否通过
    if (data) {
      this.adminUserTaskService.verifyUserTaskApproved(userTaskInfo, {});
    } else {
      this.adminUserTaskService.verifyUserTaskRejected(userTaskInfo, {
        verificationNote: `机器自动审核---${message}`,
      });
    }
  }
}

import { Body, Controller, Post } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { UserTaskStatus } from '@yikart/task-db'
import {
  AdminQueryUserTaskDto,
  RejectedTaskDto,
  UserTaskApprovedDto,
  UserTaskIdDto,
} from './admin.dto'
import { BooleanResultVo, NumberResultVo } from './admin.vo'
import { UserTaskAdminService } from './user-task.service'

@Controller('admin/userTask')
export class UserTaskAdminController {
  constructor(
    private readonly userTaskAdminService: UserTaskAdminService,
  ) { }

  // @NatsMessagePattern('task.admin.userTask.list')
  @Post('list')
  async getList(@Body() data: AdminQueryUserTaskDto) {
    const res = await this.userTaskAdminService.getList(data.page, data.filter)
    return res
  }

  // @NatsMessagePattern('task.admin.userTask.info')
  @Post('info')
  async getTaskInfo(@Body() data: UserTaskIdDto) {
    const res = await this.userTaskAdminService.getUserTaskInfoById(data.id)
    if (!res) {
      throw new AppException(1000, 'The user task does not exist.')
    }
    return res
  }

  // @NatsMessagePattern('task.admin.userTask.approvedTaskCount')
  @Post('approvedTaskCount')
  async getCompletedTaskCount(): Promise<NumberResultVo> {
    const res = await this.userTaskAdminService.getCompletedTaskCount()
    return NumberResultVo.create({ count: res })
  }

  // @NatsMessagePattern('task.admin.userTask.approvedUserCount')
  @Post('approvedUserCount')
  async getCompletedUserCount(): Promise<NumberResultVo> {
    const res = await this.userTaskAdminService.getCompletedUserCount()
    return NumberResultVo.create({ count: res })
  }

  /**
   * 任务通过并发放奖励
   * @param data
   * @returns
   */
  // @NatsMessagePattern('task.admin.userTask.verifyApproved')
  @Post('verifyApproved')
  async verifyUserTaskApproved(@Body() data: UserTaskApprovedDto): Promise<BooleanResultVo> {
    const userTask = await this.userTaskAdminService.getUserTaskInfoById(data.id)
    if (!userTask)
      throw new AppException(1000, 'The user task does not exist.')
    if (![UserTaskStatus.PENDING, UserTaskStatus.APPROVED, UserTaskStatus.REJECTED].includes(userTask.status))
      throw new AppException(1000, 'The task status is invalid.')

    const res = await this.userTaskAdminService.verifyUserTaskApproved(userTask, {
      verifierUserId: data.userId,
      screenshotUrls: data.screenshotUrls,
    })
    return BooleanResultVo.create({ success: res })
  }

  /**
   * 任务拒绝
   * @param data
   * @returns
   */
  // @NatsMessagePattern('task.admin.userTask.verifyRejected')
  @Post('verifyRejected')
  async verifyUserTaskRejected(@Body() data: RejectedTaskDto): Promise<BooleanResultVo> {
    const userTask = await this.userTaskAdminService.getUserTaskInfoById(data.id)
    if (!userTask)
      throw new AppException(1000, 'The user task does not exist.')
    if (![UserTaskStatus.PENDING, UserTaskStatus.APPROVED, UserTaskStatus.REJECTED].includes(userTask.status))
      throw new AppException(1000, 'The task status is invalid.')
    const res = await this.userTaskAdminService.verifyUserTaskRejected(userTask, {
      ...data,
    })
    return BooleanResultVo.create({ success: res })
  }

  /**
   * 回退任务
   * @param data
   * @returns
   */
  // @NatsMessagePattern('task.admin.userTask.rollbackApproved')
  @Post('rollbackApproved')
  async rollbackUserTaskApproved(@Body() data: RejectedTaskDto): Promise<BooleanResultVo> {
    const userTask = await this.userTaskAdminService.getUserTaskInfoById(data.id)
    if (!userTask)
      throw new AppException(1000, 'The user task does not exist.')
    if (userTask.status !== UserTaskStatus.APPROVED)
      throw new AppException(1000, 'The task status is invalid.')

    const res = await this.userTaskAdminService.rollbackUserTaskApproved(userTask, {
      verifierUserId: data.verifierUserId,
      verificationNote: data.verificationNote || '管理员撤回任务',
      rejectionReason: data.rejectionReason || '管理员拒绝任务',
    })
    return BooleanResultVo.create({ success: res })
  }

  // @NatsMessagePattern('task.admin.userTask.auto.auditRun')
  @Post('auto/auditRun')
  async runUserTaskAuditAuto(@Body() inData: UserTaskIdDto) {
    const userTaskInfo = await this.userTaskAdminService.getUserTaskInfoById(
      inData.id,
    )
    if (!userTaskInfo)
      throw new AppException(1000, 'The user task does not exist.')

    const { status, message, retry, data }
      = await this.userTaskAdminService.autoAuditTask(inData.id)

    this.userTaskAdminService.updateUserTaskAutoStatus(inData.id, {
      status,
      message,
    })

    if (!status) {
      return {
        status: false,
        message,
        retry,
      }
    }

    if (data) {
      this.userTaskAdminService.verifyUserTaskApproved(userTaskInfo, {})
    }
    else {
      this.userTaskAdminService.verifyUserTaskRejected(userTaskInfo, {
        verificationNote: `人工触发自动审核---${message}`,
      })
    }

    return {
      status: true,
      message: '审核成功',
    }
  }
}

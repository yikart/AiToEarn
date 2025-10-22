import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AccountType, TaskRepository, TaskType, UserTask, UserTaskAdminRepository, UserTaskStatus } from '@yikart/task-db'
import { AccountHttpApi } from '../../../transports/account/account.httpApi'
import { IncomeType } from '../../../transports/user/comment'
import { IncomeNatsApi } from '../../../transports/user/income.natsApi'
import { AdminUtilService } from '../admin-util.service'
import { UserTaskService } from '../userTask.service'
import { UserTaskFilterDto } from './admin.dto'

@Injectable()
export class UserTaskAdminService {
  constructor(
    private userTaskAdminRepository: UserTaskAdminRepository,
    private taskRepository: TaskRepository,
    readonly userService: UserTaskService,
    readonly adminUtilService: AdminUtilService,
    readonly accountApi: AccountHttpApi,
    readonly incomeNatsApi: IncomeNatsApi,
  ) { }

  async getUserTaskInfoById(id: string): Promise<UserTask | null> {
    const task = await this.userTaskAdminRepository.getUserTaskInfoById(id)
    return task
  }

  async getUserTaskInfoByTaskIdOfUser(
    taskId: string,
    userId: string,
  ): Promise<UserTask | null> {
    return await this.userTaskAdminRepository.getUserTaskInfoByTaskIdOfUser(taskId, userId)
  }

  /**
   * 获取用户的任务列表
   * @param pageInfo
   * @param query
   * @returns
   */
  async getList(pageInfo: TableDto, query: UserTaskFilterDto) {
    return await this.userTaskAdminRepository.getList(pageInfo, query)
  }

  /**
   * 验证任务-通过
   * @param userTask
   * @returns
   */
  async verifyUserTaskApproved(
    userTask: UserTask,
    data: {
      verifierUserId?: string
      screenshotUrls?: string[]
    },
  ): Promise<boolean> {
    const res = await this.userTaskAdminRepository.verifyUserTaskApproved(userTask, data)

    // TODO: 更新用户余额
    // await this.financeService.updateUserWalletBalance(
    //   userTask.userId,
    //   task.reward,
    // );

    return res
  }

  /**
   * 验证任务-拒绝
   * @param userTask
   * @param data
   * @returns
   */
  async verifyUserTaskRejected(
    userTask: UserTask,
    data: {
      verifierUserId?: string
      verificationNote?: string // 人工核查备注
      rejectionReason?: string // 拒绝原因
    },
  ): Promise<boolean> {
    return await this.userTaskAdminRepository.verifyUserTaskRejected(userTask, data)
  }

  /**
   * 验证任务-回退
   * @param userTask
   * @returns
   */
  async rollbackUserTaskApproved(
    userTask: UserTask,
    data: {
      verifierUserId: string
      verificationNote: string // 人工核查备注
      rejectionReason: string // 拒绝原因
    },
  ): Promise<boolean> {
    if (userTask.status !== UserTaskStatus.APPROVED)
      return false

    const task = await this.taskRepository.findOneById(userTask.taskId)
    if (!task)
      return false

    const res = await this.userTaskAdminRepository.rollbackUserTaskApproved(userTask, data)

    await this.incomeNatsApi.deduct(userTask.userId, {
      amount: task.reward,
      type: IncomeType.TASK_BACK,
      relId: task.id,
      desc: 'The task is withdrawn and the balance is deducted',
    })

    return res
  }

  // 获取已完成任务的总数
  async getCompletedTaskCount() {
    return await this.userTaskAdminRepository.getCompletedTaskCount()
  }

  // 获取完成过任务的用户总数
  async getCompletedUserCount(): Promise<number> {
    return await this.userTaskAdminRepository.getCompletedUserCount()
  }

  /**
   * 自动审核 TODO: 未使用
   * @param userTaskId
   */
  async autoAuditTask(userTaskId: string): Promise<{
    status: 0 | 1 // 0:成功 1:失败
    message: string
    retry: boolean
    data?: boolean
  }> {
    const userTaskInfo = await this.userTaskAdminRepository.getById(userTaskId)
    if (!userTaskInfo) {
      return {
        status: 0,
        message: '用户任务不存在',
        retry: false,
      }
    }

    if (userTaskInfo.status !== UserTaskStatus.PENDING) {
      return {
        status: 0,
        message: '用户任务状态错误',
        retry: false,
      }
    }

    const taskInfo = await this.taskRepository.findOneById(userTaskInfo.taskId)
    if (!taskInfo) {
      return {
        status: 0,
        message: '任务不存在',
        retry: false,
      }
    }

    const account = await this.accountApi.getAccountInfoById(
      userTaskInfo.accountId,
    )

    if (
      taskInfo.type === TaskType.ARTICLE
      && account.type === AccountType.Xhs as any
    ) {
      // 对比文本内容
      const { status: contentCheckStatus, extent }
        = await this.adminUtilService.articleXhsContentCheck(
          // taskMaterialInfo.desc,
          '',
          '',
        )

      if (contentCheckStatus === 0) {
        return {
          status: 0,
          message: '内容检测失败，请重试',
          retry: true,
        }
      }

      if (extent <= 0.8) {
        return {
          status: 1,
          message: '内容相似度小于80%，请重新提交',
          retry: false,
          data: false,
        }
      }

      // 进行奖励发放
      const res = await this.verifyUserTaskApproved(userTaskInfo, {})
      if (!res) {
        return {
          status: 0,
          message: '自动审核或发放奖励失败，请重试',
          retry: true,
        }
      }
    }

    return {
      status: 1,
      message: '成功',
      retry: false,
      data: true,
    }
  }

  // 更新用户任务自动状态
  async updateUserTaskAutoStatus(
    userTaskId: string,
    data: { status: 0 | 1, message: string },
  ): Promise<boolean> {
    return await this.userTaskAdminRepository.updateUserTaskAutoStatus(userTaskId, data)
  }
}

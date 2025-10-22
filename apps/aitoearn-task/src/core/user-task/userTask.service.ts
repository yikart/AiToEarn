import { Injectable } from '@nestjs/common'
import { AppException, TableDto } from '@yikart/common'
import { TaskOpportunityStatus, TaskStatus, UserTask, UserTaskRepository, UserTaskStatus } from '@yikart/task-db'
import { AccountHttpApi } from '../../transports/account/account.httpApi'
import { MaterialNatsApi } from '../../transports/content/material.natsApi'
import { IncomeType } from '../../transports/user/comment'
import { IncomeNatsApi } from '../../transports/user/income.natsApi'
import { TaskService } from '../task/task.service'
import { TaskOpportunityService } from '../task/taskOpportunity.service'

@Injectable()
export class UserTaskService {
  constructor(
    private readonly userTaskRepository: UserTaskRepository,
    private readonly materialNatsApi: MaterialNatsApi,
    private readonly accountNatsApi: AccountHttpApi,
    private readonly incomeNatsApi: IncomeNatsApi,
    private readonly taskOpportunityService: TaskOpportunityService,
    private readonly taskService: TaskService,
  ) { }

  /**
   * 用户任务增加收入
   * @param userTask
   * @returns
   */
  private addIncome(userTask: UserTask) {
    return this.incomeNatsApi.add(userTask.userId, {
      type: IncomeType.TASK,
      amount: userTask.reward,
      relId: userTask.id,
      desc: 'auto task reward',
      metadata: {
        taskId: userTask.taskId,
        userTaskId: userTask.id,
        taskOpportunityId: userTask.opportunityId,
      },
    })
  }

  async acceptTask(userId: string, opportunityId: string, accountId?: string): Promise<UserTask> {
    // 查询发布内容
    const opportunity = await this.taskOpportunityService.findOneById(opportunityId)
    if (!opportunity || opportunity.userId !== userId) {
      throw new AppException(1000, 'Task Opportunity Not Found')
    }
    if (new Date() > opportunity.expiredAt) {
      throw new AppException(1000, 'Task Already Applied')
    }

    const taskInfo = await this.taskService.findOneById(opportunity.taskId)
    if (!taskInfo) {
      throw new AppException(1000, 'Task Not Found')
    }
    if (taskInfo.status !== TaskStatus.ACTIVE) {
      throw new AppException(1000, 'Task Status Invalid')
    }
    if (new Date() > taskInfo.deadline) {
      throw new AppException(1000, 'Task Expired')
    }

    // 人数查询
    if (taskInfo.currentRecruits >= taskInfo.maxRecruits) {
      throw new AppException(1000, 'Task Recruits Full')
    }

    if (accountId) {
      const account = await this.accountNatsApi.getAccountInfoById(accountId)
      if (!account) {
        throw new AppException(1000, 'Account Not Found')
      }
      if (account.userId !== userId) {
        throw new AppException(1000, 'Account Not Belong To User')
      }

      if (taskInfo.accountTypes && taskInfo.accountTypes.length > 0 && !taskInfo.accountTypes.includes(account.type)) {
        throw new AppException(1000, 'Task Account Type No Invalid')
      }

      opportunity.accountId = accountId
      opportunity.accountType = account.type
      opportunity.uid = account.uid
    }

    // 验证是否有已经接受的任务
    const existingUserTask = await this.userTaskRepository.findOne({
      taskId: taskInfo._id,
      accountId: opportunity.accountId,
    })
    if (existingUserTask) {
      throw new AppException(1000, 'This task has already been taken up by this account')
    }

    const userTask = await this.userTaskRepository.create({
      taskId: taskInfo.id,
      opportunityId: opportunity.id,
      userId,
      accountType: opportunity.accountType,
      uid: opportunity.uid,
      accountId: opportunity.accountId,
      status: UserTaskStatus.DOING,
      reward: taskInfo.reward,
      keepTime: 0,
      isFirstTimeSubmission: true,
    })

    // change task opportunity status
    await this.taskOpportunityService.updateStatus(
      opportunity.id,
      TaskOpportunityStatus.ACCEPTED,
    )

    return userTask
  }

  async getUserTaskDetail(userId: string, id: string) {
    const userTask = await this.userTaskRepository.findOne({
      _id: id,
      userId,
    })
    if (!userTask) {
      throw new AppException(1000, 'Task Not Found')
    }

    const task = await this.taskService.findOneById(userTask.taskId.toString())

    if (!task)
      return userTask
    if (!task.materialGroupId)
      return userTask

    const material = await this.materialNatsApi.optimalInGroup(task.materialGroupId)
    if (!material)
      throw new AppException(1000, 'The materials for this task have been consumed')

    return {
      ...userTask.toObject(),
      task: {
        ...task.toObject(),
        materials: [material],
      },
    }
  }

  async getUserTaskInfoById(id: string) {
    return this.userTaskRepository.getUserTaskInfoById(id)
  }

  async findUserTasks(page: TableDto, query: { userId: string, status?: UserTaskStatus }) {
    return this.userTaskRepository.findUserTasks(page, query)
  }

  async submitTask(data: { id: string, userId: string, materialId?: string }): Promise<boolean> {
    const userTask = await this.userTaskRepository.getById(data.id)
    if (!userTask || userTask.userId !== data.userId)
      throw new AppException(1000, 'Task Not Found')

    if (
      ![UserTaskStatus.REJECTED, UserTaskStatus.DOING].includes(
        userTask.status,
      )
    ) {
      throw new AppException(1000, 'Task Status Invalid')
    }

    // 增加收入
    this.addIncome(userTask)

    const res = await this.userTaskRepository.updateOneById(
      data.id,
      {
        status: UserTaskStatus.PENDING,
        keepTime: 0,
        submissionTime: new Date(),
        taskMaterialId: data.materialId,
      },
    )

    // 更新任务完成人数
    this.taskService.updateCurrentAmount(userTask.taskId.toString(), 1)

    return res
  }

  /**
   * 用户任务提现
   * @param id
   * @param flowId
   * @returns
   */
  async withdrawUserTask(id: string, flowId?: string): Promise<boolean> {
    const userTask = await this.userTaskRepository.getById(id)
    if (!userTask)
      throw new AppException(1000, 'Task Not Found')

    if (userTask.status === UserTaskStatus.PENDING) {
      throw new AppException(1000, 'Task Status Invalid')
    }

    // TODO: 提现
    const res = await this.userTaskRepository.updateOneById(
      id,
      {
        status: UserTaskStatus.PENDING,
        keepTime: 0,
        flowId,
        submissionTime: new Date(),
      },
    )

    return res
  }

  /**
   * 统计任务
   * @param userId
   * @returns
   */
  async getTotalAmountOfDoingTasks(userId: string): Promise<number> {
    return this.userTaskRepository.getTotalAmountOfDoingTasks(userId)
  }

  // 更新状态
  async updateStatus(id: string, status: UserTaskStatus) {
    return this.userTaskRepository.updateStatus(id, status)
  }

  async del(id: string, verificationNote: string) {
    return this.userTaskRepository.del(id, verificationNote)
  }
}

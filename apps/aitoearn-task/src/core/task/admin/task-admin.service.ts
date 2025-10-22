import { Injectable, Logger } from '@nestjs/common'
import { AppException, TableDto } from '@yikart/common'
import { Task, TaskAdminRepository, TaskStatus } from '@yikart/task-db'
import { MaterialNatsApi } from '../../../transports/content/material.natsApi'
import { NotificationType } from '../../../transports/other/common'
import { NotificationNatsApi } from '../../../transports/other/notification.natsApi'
import { UserNatsApi } from '../../../transports/user/user.natsApi'
import { AccountPortraitService } from '../../account-portrait/account-portrait.service'
import { TaskOpportunityService } from '../taskOpportunity.service'
import {
  AdminTaskListFilterDto,
  CreateTaskDto,
  PublishTaskToAccountListDto,
  PublishTaskToUserListDto,
  UpdateTaskDto,
} from './task-admin.dto'

@Injectable()
export class TaskAdminService {
  logger = new Logger(TaskAdminService.name)

  constructor(
    private readonly taskAdminRepository: TaskAdminRepository,
    private readonly materialNatsApi: MaterialNatsApi,
    private readonly accountPortraitService: AccountPortraitService,
    private readonly taskOpportunityService: TaskOpportunityService,
    private readonly notificationNatsApi: NotificationNatsApi,
    private readonly userNatsApi: UserNatsApi,
  ) { }

  async create(data: CreateTaskDto): Promise<Task> {
    if (data.materialGroupId) {
      const materialGroup = await this.materialNatsApi.getGroupInfo(
        data.materialGroupId,
      )
      if (!materialGroup) {
        throw new AppException(1000, '草稿箱不存在')
      }
    }

    // 将 deadline 字符串转换为 Date 对象
    const taskData = {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    }

    const res = await this.taskAdminRepository.create(taskData)
    return res
  }

  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    if (data.materialGroupId) {
      const materialGroup = await this.materialNatsApi.getGroupInfo(
        data.materialGroupId,
      )
      if (!materialGroup) {
        throw new AppException(1000, '草稿箱不存在')
      }
    }

    const taskData = {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    }

    return this.taskAdminRepository.update(id, taskData)
  }

  /**
   * 删除任务素材
   * @param id
   * @param materialId
   * @returns
   */
  async deleteTaskMaterial(id: string, materialId: string): Promise<boolean> {
    return await this.taskAdminRepository.deleteTaskMaterial(id, materialId)
  }

  /**
   * 添加任务素材
   * @param id
   * @param materialId
   * @returns
   */
  async addMaterial(id: string, materialIds: string[]): Promise<boolean> {
    return await this.taskAdminRepository.addMaterial(id, materialIds)
  }

  /**
   * 获取任务列表
   * @param pageInfo
   * @param query
   * @returns
   */
  async findAll(pageInfo: TableDto, data: AdminTaskListFilterDto) {
    const newData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    }
    return await this.taskAdminRepository.findAll(pageInfo, newData)
  }

  async findOne(id: string) {
    const task = await this.taskAdminRepository.findOneById(id)
    if (!task) {
      return null
    }

    // 获取任务素材
    const materials = await this.materialNatsApi.listByIds(task.materialIds)

    return {
      ...task,
      materials,
    }
  }

  /**
   * 更新任务状态
   * @param id
   * @param status
   * @returns
   */
  async updateStatus(id: string, status: TaskStatus): Promise<boolean> {
    return await this.taskAdminRepository.updateStatus(id, status)
  }

  /**
   * 更新任务素材自动删除状态
   * @param id
   * @param data
   * @returns
   */
  async updateAutoDeleteMaterial(id: string, data: boolean): Promise<boolean> {
    return await this.taskAdminRepository.updateAutoDeleteMaterial(id, data)
  }

  /**
   * 删除任务
   * @param id
   * @returns
   */
  async delTask(id: string): Promise<boolean> {
    return await this.taskAdminRepository.delTask(id)
  }

  /**
   * 发送任务给账号
   * @param task
   * @param accountId
   * @returns
   */
  private async pushTaskToAcount(
    task: Task,
    accountId: string,
    expiredAt: Date,
  ): Promise<boolean> {
    const accountInfo
      = await this.accountPortraitService.getAccountPortrait(accountId)
    if (!accountInfo)
      return false

    const userInfo = await this.userNatsApi.getInfo(accountInfo.userId)
    if (!userInfo)
      return false

    // 检查是否已经发布
    const isPublished
      = await this.taskOpportunityService.checkAccountIsPublished(
        accountId,
        task.id,
      )
    if (isPublished)
      return false

    // task publish
    const newData = await this.taskOpportunityService.create({
      accountId,
      taskId: task.id,
      userId: accountInfo.userId,
      userName: userInfo.name,
      mail: userInfo.mail,
      accountType: accountInfo.type,
      nickname: accountInfo.nickname,
      uid: accountInfo.uid,
      reward: task.reward,
      expiredAt,
    })

    // 创建通知
    await this.notificationNatsApi.createToUser({
      userId: accountInfo.userId,
      title: 'you had new task',
      content: 'you had new task',
      type: NotificationType.TaskReminder,
      relatedId: newData.id,
    })
    return true
  }

  /**
   * 发布任务到指定账号列表
   * @param data
   */
  async publishTaskToAccountList(data: PublishTaskToAccountListDto) {
    const { taskId, accountIds } = data
    const task = await this.taskAdminRepository.findById(taskId)
    if (!task) {
      throw new AppException(1000, '任务不存在')
    }

    await this.taskAdminRepository.update(
      taskId,
      { status: TaskStatus.ACTIVE },
    )

    const res: { success: string[], failed: string[] } = {
      success: [],
      failed: [],
    }

    for (const id of accountIds) {
      const ret = await this.pushTaskToAcount(task, id, task.deadline)
      if (ret) {
        res.success.push(id)
      }
      else {
        res.failed.push(id)
      }
    }
    return res
  }

  /**
   * 发送任务给账号
   * @param task
   * @param userId
   * @param expiredAt
   * @returns
   */
  async pushTaskToUser(
    task: Task,
    userId: string,
  ): Promise<boolean> {
    const userInfo = await this.userNatsApi.getInfo(userId)
    if (!userInfo)
      return false

    // task publish
    const newData = await this.taskOpportunityService.create({
      taskId: task.id,
      userId,
      userName: userInfo.name,
      mail: userInfo.mail,
      accountTypes: task.accountTypes,
      reward: task.reward,
      expiredAt: task.deadline,
    })

    // 创建通知
    await this.notificationNatsApi.createToUser({
      userId,
      title: 'you had new task',
      content: 'you had new task',
      type: NotificationType.TaskReminder,
      relatedId: newData.id,
    })
    return true
  }

  findById(id: string) {
    return this.taskAdminRepository.findOneById(id)
  }

  /**
   * 发布任务到指定账号列表
   * @param data
   */
  async publishTaskToUserList(data: PublishTaskToUserListDto) {
    const { taskId, userIds } = data
    const task = await this.taskAdminRepository.findOneById(taskId)
    if (!task) {
      throw new AppException(1000, '任务不存在')
    }

    await this.taskAdminRepository.update(
      taskId,
      { status: TaskStatus.ACTIVE },
    )

    for (const id of userIds) {
      await this.pushTaskToUser(task, id)
    }
  }

  /**
   * 获取派给新用户的任务列表
   * @returns
   */
  async findToNewUserTask(num = 10) {
    return await this.taskAdminRepository.findToNewUserTask(num)
  }
}

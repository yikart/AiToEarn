import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { AppException } from '@yikart/common'
import { TaskPunish, TaskPunishRepository } from '@yikart/task-db'
import { NotificationType } from '../../transports/other/common'
import { NotificationNatsApi } from '../../transports/other/notification.natsApi'
import { UserTaskService } from '../user-task'
import {
  CreateTaskPunishDto,
  QueryTaskPunishDto,
  UpdateTaskPunishDto,
} from './taskPunish.dto'

@Injectable()
export class TaskPunishService {
  constructor(
    private readonly taskPunishRepository: TaskPunishRepository,
    private readonly notificationNatsApi: NotificationNatsApi,
    private readonly userTaskService: UserTaskService,
    private eventEmitter: EventEmitter2,
  ) { }

  async create(data: CreateTaskPunishDto): Promise<TaskPunish> {
    const userTaskInfo = await this.userTaskService.getUserTaskInfoById(
      data.userTaskId,
    )
    if (!userTaskInfo) {
      throw new AppException(1000, 'Invalid user task id')
    }
    const res = await this.taskPunishRepository.create(data)

    // 删除用户任务
    this.userTaskService.del(userTaskInfo.id, data.title)

    // 增加处罚次数
    this.eventEmitter.emit(
      'user.portrait.updateTotalViolations',
      {
        userId: data.userId,
        count: 1,
      },
    )

    // 发送通知
    this.notificationNatsApi.createToUser(
      {
        content: `You have been punished for ${data.title}`,
        title: 'Punishment',
        type: NotificationType.TaskPunish,
        userId: data.userId,
        relatedId: data.userTaskId,
      },
    )

    return res
  }

  async findById(id: string): Promise<TaskPunish | null> {
    const res = await this.taskPunishRepository.findById(id)
    return res
  }

  async update(data: UpdateTaskPunishDto): Promise<TaskPunish | null> {
    const res = await this.taskPunishRepository.update(data.id, data)
    return res
  }

  async delete(id: string) {
    const res = await this.taskPunishRepository.delete(id)
    return res
  }

  async getList(query: QueryTaskPunishDto) {
    const res = await this.taskPunishRepository.getList(query.page, query.filter)
    return res
  }
}

import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AppException } from '@yikart/common'
import {
  AdminTaskListDto,
  CreateTaskDto,
  PublishTaskToAccountListDto,
  PublishTaskToUserListDto,
  PushTaskWithUserCreateDto,
  TaskIdDto,
  UpdateAutoDeleteMaterialDto,
  UpdateTaskDto,
  UpTaskStatusDto,
} from './task-admin.dto'
import { TaskAdminService } from './task-admin.service'
import { TaskListVo, TaskVo } from './task-admin.vo'

@ApiTags('admin/task - 任务管理')
@Controller('admin/task')
export class TaskAdminController {
  constructor(
    private readonly taskAdminService: TaskAdminService,
  ) {}

  // @NatsMessagePattern('task.admin.task.create')
  @Post('create')
  async createTask(@Body() data: CreateTaskDto) {
    const res = await this.taskAdminService.create(data)
    return res
  }

  // @NatsMessagePattern('task.admin.task.update')
  @Post('update')
  async updateTask(@Body() data: UpdateTaskDto) {
    const res = await this.taskAdminService.update(data.id, data)
    return res
  }

  // @NatsMessagePattern('task.admin.task.material.delete')
  @Post('material.delete')
  async deleteTaskMaterial(@Body() data: { id: string, materialId: string }) {
    const res = await this.taskAdminService.deleteTaskMaterial(data.id, data.materialId)
    return res
  }

  // @NatsMessagePattern('task.admin.task.material.add')
  @Post('material.add')
  async addTaskMaterial(@Body() data: { id: string, materialIds: string[] }) {
    const res = await this.taskAdminService.addMaterial(data.id, data.materialIds)
    return res
  }

  // @NatsMessagePattern('task.admin.task.delete')
  @Post('delete')
  async deleteTask(@Body() data: TaskIdDto) {
    return await this.taskAdminService.delTask(data.id)
  }

  // @NatsMessagePattern('task.admin.task.updateStatus')
  @Post('updateStatus')
  async upTaskStatus(@Body() data: UpTaskStatusDto) {
    return await this.taskAdminService.updateStatus(data.id, data.status)
  }

  // @NatsMessagePattern('task.admin.task.updateAutoDeleteMaterial')
  @Post('updateAutoDeleteMaterial')
  async updateAutoDeleteMaterial(@Body() data: UpdateAutoDeleteMaterialDto) {
    return await this.taskAdminService.updateAutoDeleteMaterial(data.id, data.data)
  }

  // @NatsMessagePattern('task.admin.task.list')
  @Post('list')
  async getTasks(@Body() data: AdminTaskListDto): Promise<TaskListVo> {
    const res = await this.taskAdminService.findAll(data.page, data.filter)
    return res
  }

  // @NatsMessagePattern('task.admin.task.info')
  @Post('info')
  async getTask(@Body() data: TaskIdDto): Promise<TaskVo> {
    const res = await this.taskAdminService.findOne(data.id)
    if (!res) {
      throw new AppException(1000, '任务不存在')
    }
    return TaskVo.create(res)
  }

  /**
   * 发布任务到指定频道号列表
   */
  // @NatsMessagePattern('task.admin.task.publish.accountList')
  @Post('publish.accountList')
  async publishTaskToAccountList(@Body() data: PublishTaskToAccountListDto) {
    return await this.taskAdminService.publishTaskToAccountList(data)
  }

  /**
   * 发布任务到指定用户账号列表
   */
  // @NatsMessagePattern('task.admin.task.publish.userList')
  @Post('publish.userList')
  async publishTaskToUserList(@Body() data: PublishTaskToUserListDto): Promise<void> {
    return await this.taskAdminService.publishTaskToUserList(data)
  }

  // @NatsMessagePattern('task.push.withUserCreate')
  @Post('push.withUserCreate')
  async pushTaskWithUserCreate(@Body() data: PushTaskWithUserCreateDto) {
    // 寻找合适的任务
    const taskList = await this.taskAdminService.findToNewUserTask()
    for (const task of taskList) {
      this.taskAdminService.pushTaskToUser(task, data.userId)
    }
    return true
  }
}

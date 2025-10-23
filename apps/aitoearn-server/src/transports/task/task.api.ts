import { Injectable } from '@nestjs/common'
import { UpdateTaskDto } from '../../core/task/task.dto'
import { TaskBaseApi } from '../taskBase.api'
import {
  CreateTaskRequest,
  Task,
  TaskListRequest,
  TaskOpportunityList,
} from './task.interface'

@Injectable()
export class TaskApi extends TaskBaseApi {
  async create(data: CreateTaskRequest): Promise<Task> {
    return await this.sendMessage<Task>(
      'task/admin/task/create',
      data,
    )
  }

  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    return await this.sendMessage<Task>(
      'task/admin/task/update',
      { id, ...data },
    )
  }

  async deleteTaskMaterial(id: string, materialId: string) {
    return await this.sendMessage<boolean>(
      'task/admin/task/material/delete',
      { id, materialId },
    )
  }

  async addTaskMaterial(id: string, materialIds: string[]) {
    return await this.sendMessage<boolean>(
      'task/admin/task/material/add',
      { id, materialIds },
    )
  }

  async delete(id: string) {
    return await this.sendMessage(
      'task/admin/task/delete',
      { id },
    )
  }

  async updateStatus(id: string, status: string) {
    return await this.sendMessage(
      'task/admin/task/updateStatus',
      { id, status },
    )
  }

  async getList(request: TaskListRequest): Promise<{ list: Task[], total: number }> {
    return await this.sendMessage<{ list: Task[], total: number }>(
      'task/admin/task/list',
      request,
    )
  }

  async getById(id: string): Promise<Task> {
    return await this.sendMessage<Task>(
      'task/admin/task/info',
      { id },
    )
  }

  /**
   * 发送任务给账号列表
   * @param taskId
   * @param accountIds
   * @returns
   */
  async publishTaskToAccountList(taskId: string, accountIds: string[]) {
    return await this.sendMessage(
      'task/admin/task/publish/accountList',
      { taskId, accountIds },
    )
  }

  /**
   * 发送任务给账号列表
   * @param taskId
   * @param userIds
   * @returns
   */
  async publishTaskToUserList(taskId: string, userIds: string[]) {
    return await this.sendMessage(
      'task/admin/task/publish/userList',
      { taskId, userIds },
    )
  }

  async getOpportunityList(request: TaskOpportunityList): Promise<{ list: any[], total: number }> {
    return await this.sendMessage<{ list: any[], total: number }>(
      'task/admin/taskOpportunity/list',
      request,
    )
  }

  async delOpportunity(id: string): Promise<boolean> {
    return await this.sendMessage<boolean>(
      'task/admin/taskOpportunity/del',
      { id },
    )
  }

  async updateAutoDeleteMaterial(id: string, data: boolean): Promise<boolean> {
    return await this.sendMessage<boolean>(
      'task/admin/task/updateAutoDeleteMaterial',
      { id, data },
    )
  }
}

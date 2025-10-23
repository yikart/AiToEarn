import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { TaskApi } from '../../transports/task/task.api'
import { CreateTaskDto, TaskListQueryDto, UpdateTaskDto, UpdateTaskStatusDto } from './task.dto'

@Injectable()
export class TaskService {
  constructor(private readonly taskApi: TaskApi) {}

  async create(body: CreateTaskDto) {
    return await this.taskApi.create(body)
  }

  async update(id: string, updateDto: UpdateTaskDto) {
    return await this.taskApi.update(id, updateDto)
  }

  async delete(id: string) {
    return await this.taskApi.delete(id)
  }

  async deleteTaskMaterial(id: string, materialId: string) {
    return await this.taskApi.deleteTaskMaterial(id, materialId)
  }

  async addTaskMaterial(id: string, materialIds: string[]) {
    return await this.taskApi.addTaskMaterial(id, materialIds)
  }

  async updateStatus(id: string, statusDto: UpdateTaskStatusDto) {
    return await this.taskApi.updateStatus(id, statusDto.status)
  }

  async updateAutoDeleteMaterial(id: string, data: boolean) {
    return await this.taskApi.updateAutoDeleteMaterial(id, data)
  }

  async getList(page: TableDto, filter: TaskListQueryDto) {
    return await this.taskApi.getList({ page, filter })
  }

  async getById(id: string) {
    return await this.taskApi.getById(id)
  }

  async publishTaskToAccountList(id: string, accountIds: string[]) {
    const res = await this.taskApi.publishTaskToAccountList(id, accountIds)
    return res
  }

  async publishTaskToUserList(id: string, userIds: string[]) {
    return await this.taskApi.publishTaskToUserList(id, userIds)
  }

  async listMaterialsByTaskId(taskId: string) {
    const task = await this.taskApi.getById(taskId)
    return task.materials
  }

  async getOpportunityList(page: TableDto, filter: { taskId: string, userId?: string }) {
    return await this.taskApi.getOpportunityList({ page, filter })
  }

  async delOpportunity(id: string) {
    return await this.taskApi.delOpportunity(id)
  }
}

import { Injectable } from '@nestjs/common'
import { AppException } from '@yikart/common'
import { TaskOpportunityRepository, TaskRepository } from '@yikart/task-db'
import { Material } from '../../transports/content/common'
import { MaterialNatsApi } from '../../transports/content/material.natsApi'

@Injectable()
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly taskOpportunityRepository: TaskOpportunityRepository,
    private readonly materialNatsApi: MaterialNatsApi,
  ) { }

  async findOneById(id: string) {
    const task = await this.taskRepository.findOneById(id)
    return task
  }

  async findOne(id: string) {
    const task = await this.taskRepository.findOneById(id)
    if (!task) {
      throw new AppException(1000, 'The task does not exist.')
    }

    const materials = await this.materialNatsApi.listByIds(task.materialIds)

    return {
      ...task.toObject(),
      materials,
    }
  }

  async getTaskWithOpportunity(opportunityId: string) {
    const opportunity = await this.taskOpportunityRepository.findOneById(opportunityId)
    if (!opportunity) {
      throw new AppException(1000, 'The task does not exist.')
    }

    const task = await this.findOneById(opportunity.taskId)
    if (!task) {
      throw new AppException(1000, 'The task does not exist.')
    }

    let materials: Material[] = []
    const material = await this.materialNatsApi.optimalByIds(task.materialIds)
    if (material) {
      materials = [material]
    }

    return {
      ...task.toObject(),
      materials,
      opportunityId: opportunity._id,
      opportunityStatus: opportunity.status,
      expiredAt: opportunity.expiredAt,
      accountId: opportunity.accountId,
    }
  }

  // 更新任务当前的接取人数
  async updateCurrentAmount(taskId: string, amount: number): Promise<boolean> {
    return await this.taskRepository.updateCurrentAmount(taskId, amount)
  }
}

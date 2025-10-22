import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AdminTaskOpportunityRepository, TaskOpportunity } from '@yikart/task-db'

@Injectable()
export class AdminTaskOpportunityService {
  constructor(
    private readonly adminTaskOpportunityRepository: AdminTaskOpportunityRepository,
  ) { }

  // 获取列表
  async findList(pageInfo: TableDto, query: { taskId: string, userId?: string }) {
    return await this.adminTaskOpportunityRepository.findList(pageInfo, query)
  }

  // 删除
  async delete(id: string): Promise<boolean> {
    return await this.adminTaskOpportunityRepository.delete(id)
  }

  // 详情
  async info(id: string): Promise<TaskOpportunity | null> {
    return await this.adminTaskOpportunityRepository.info(id)
  }
}

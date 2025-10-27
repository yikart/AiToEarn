import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { AccountType, TaskOpportunityRepository, TaskOpportunityStatus } from '@yikart/task-db'

@Injectable()
export class TaskOpportunityService {
  constructor(
    private readonly taskOpportunityRepository: TaskOpportunityRepository,
  ) { }

  async findOneById(id: string) {
    const res = await this.taskOpportunityRepository.findOneById(id)
    return res
  }

  // 创建
  async create(newData: {
    accountId?: string
    nickname?: string
    taskId: string
    userId: string
    userName?: string
    mail?: string
    accountType?: AccountType
    accountTypes?: AccountType[]
    uid?: string
    reward: number
    expiredAt: Date
  }) {
    return await this.taskOpportunityRepository.create(newData)
  }

  // 删除
  async delete(id: string): Promise<boolean> {
    const res = await this.taskOpportunityRepository.delete(id)
    return res
  }

  // 更新状态
  async updateStatus(id: string, status: TaskOpportunityStatus) {
    const res = await this.taskOpportunityRepository.updateStatus(id, status)
    return res
  }

  // 检查是否已经给账号发布过任务
  async checkAccountIsPublished(accountId: string, taskId: string): Promise<boolean> {
    const res = await this.taskOpportunityRepository.checkAccountIsPublished(accountId, taskId)
    return !!res
  }

  async checkUserIsPublished(userId: string, taskId: string): Promise<boolean> {
    const res = await this.taskOpportunityRepository.checkUserIsPublished(userId, taskId)
    return res
  }

  // 获取列表
  async findList(pageInfo: TableDto, query: { userId?: string }) {
    const res = await this.taskOpportunityRepository.findList(pageInfo, query)
    return res
  }

  // 查看派发
  async doView(userId: string, id: string) {
    const res = await this.taskOpportunityRepository.doView(userId, id)
    return res
  }

  // 一键查看
  async doViewAll(userId: string) {
    // TODO: 后面补 未读的，未接受的筛选
    const res = await this.taskOpportunityRepository.doViewAll(userId)
    return res
  }

  // 获取未读的派发总数
  async getNotViewCount(userId: string) {
    const res = await this.taskOpportunityRepository.getNotViewCount(userId)
    return res
  }
}

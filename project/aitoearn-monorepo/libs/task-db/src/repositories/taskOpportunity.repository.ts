import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { AccountType } from '../enums'
import { TaskOpportunity, TaskOpportunityStatus } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class TaskOpportunityRepository extends BaseRepository<TaskOpportunity> {
  constructor(
    @InjectModel(TaskOpportunity.name) private taskOpportunityModel: Model<TaskOpportunity>,
  ) {
    super(taskOpportunityModel)
  }

  async findOneById(id: string) {
    const res = await this.taskOpportunityModel.findById(id).lean().exec()
    return res
  }

  // 创建
  override async create(newData: {
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
    const res = await this.taskOpportunityModel.create(newData)
    return res
  }

  // 删除
  async delete(id: string): Promise<boolean> {
    const res = await this.taskOpportunityModel.deleteOne({ _id: id }).exec()
    return res.deletedCount > 0
  }

  // 更新状态
  async updateStatus(id: string, status: TaskOpportunityStatus) {
    const res = await this.taskOpportunityModel.findByIdAndUpdate(id, { status }, { new: true })
    return res
  }

  // 检查是否已经给账号发布过任务
  async checkAccountIsPublished(accountId: string, taskId: string): Promise<boolean> {
    const res = await this.taskOpportunityModel.findOne({ accountId, taskId })
    return !!res
  }

  async checkUserIsPublished(userId: string, taskId: string): Promise<boolean> {
    const res = await this.taskOpportunityModel.findOne({ userId, taskId })
    return !!res
  }

  // 获取列表
  async findList(pageInfo: {
    pageSize: number
    pageNo: number
  }, query: { userId?: string }) {
    const { pageSize, pageNo } = pageInfo
    const { userId } = query
    const filter: RootFilterQuery<TaskOpportunity> = {
      status: TaskOpportunityStatus.PENDING,
      ...(userId !== undefined && { userId }),
    }

    const [total, list] = await Promise.all([
      this.taskOpportunityModel.countDocuments(filter),
      this.taskOpportunityModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize),
    ])

    return {
      list,
      total,
    }
  }

  // 查看派发
  async doView(userId: string, id: string) {
    const res = await this.taskOpportunityModel.findOneAndUpdate({ _id: id, userId }, { isView: true })
    return res
  }

  // 一键查看
  async doViewAll(userId: string) {
    // TODO: 后面补 未读的，未接受的筛选
    const res = await this.taskOpportunityModel.updateMany({ userId }, { isView: true })
    return res
  }

  // 获取未读的派发总数
  async getNotViewCount(userId: string) {
    const res = await this.taskOpportunityModel.countDocuments({ userId, isView: false, status: TaskOpportunityStatus.PENDING })
    return res
  }
}

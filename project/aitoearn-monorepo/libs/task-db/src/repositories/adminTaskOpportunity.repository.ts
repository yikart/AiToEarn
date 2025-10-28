import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { TableDto } from '@yikart/common'
import { Model, RootFilterQuery } from 'mongoose'
import { TaskOpportunity } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class AdminTaskOpportunityRepository extends BaseRepository<TaskOpportunity> {
  constructor(
    @InjectModel(TaskOpportunity.name) private taskOpportunityModel: Model<TaskOpportunity>,
  ) {
    super(taskOpportunityModel)
  }

  // 获取列表
  async findList(pageInfo: TableDto, query: { taskId: string, userId?: string }) {
    const { pageSize, pageNo } = pageInfo
    const { userId } = query
    const filter: RootFilterQuery<TaskOpportunity> = {
      taskId: query.taskId,
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

  // 删除
  async delete(id: string): Promise<boolean> {
    const res = await this.taskOpportunityModel.deleteOne({ _id: id })
    return res.deletedCount > 0
  }

  // 详情
  async info(id: string): Promise<TaskOpportunity | null> {
    return await this.taskOpportunityModel.findById(id)
  }
}

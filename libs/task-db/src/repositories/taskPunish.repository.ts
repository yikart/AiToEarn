import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { TaskPunish } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class TaskPunishRepository extends BaseRepository<TaskPunish> {
  constructor(
    @InjectModel(TaskPunish.name) private taskPunishModel: Model<TaskPunish>,
  ) {
    super(taskPunishModel)
  }

  override async create(data: Partial<TaskPunish>) {
    const res = await this.taskPunishModel.create(data)
    return res
  }

  async findById(id: string): Promise<TaskPunish | null> {
    return await this.taskPunishModel.findById(id).exec()
  }

  async update(id: string, data: Partial<TaskPunish>): Promise<TaskPunish | null> {
    return await this.taskPunishModel
      .findByIdAndUpdate(id, data)
      .exec()
  }

  async delete(id: string) {
    await this.taskPunishModel.deleteOne({ _id: id }).exec()
  }

  async getList(page: {
    pageNo: number
    pageSize: number
  }, filter: {
    taskId?: string
    name?: string
  }) {
    const queryFilter: RootFilterQuery<TaskPunish> = {
      ...(filter.taskId && { taskId: filter.taskId }),
      ...(filter.name && { name: filter.name }),
    }

    const [list, total] = await Promise.all([
      this.taskPunishModel
        .find(queryFilter)
        .skip((page.pageNo - 1) * page.pageSize)
        .limit(page.pageSize)
        .sort({ createdAt: -1 })
        .exec(),
      this.taskPunishModel.countDocuments(queryFilter).exec(),
    ])

    return {
      list,
      total,
    }
  }
}

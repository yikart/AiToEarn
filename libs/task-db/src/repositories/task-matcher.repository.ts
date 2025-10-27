import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { TaskMatcher } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class TaskMatcherRepository extends BaseRepository<TaskMatcher> {
  constructor(
    @InjectModel(TaskMatcher.name) private taskMatcherModel: Model<TaskMatcher>,
  ) {
    super(taskMatcherModel)
  }

  override async create(createDto: Partial<TaskMatcher>) {
    return await this.taskMatcherModel.create(createDto)
  }

  async findById(id: string): Promise<TaskMatcher | null> {
    return await this.taskMatcherModel.findById(id).exec()
  }

  async update(id: string, updateDto: Partial<TaskMatcher>): Promise<TaskMatcher | null> {
    return await this.taskMatcherModel
      .findByIdAndUpdate(id, updateDto)
      .exec()
  }

  async delete(id: string) {
    await this.taskMatcherModel.deleteOne({ _id: id }).exec()
  }

  async getList(page: {
    pageNo: number
    pageSize: number
  }, query: {
    taskId?: string
    name?: string
  }) {
    const { pageNo, pageSize } = page
    const { taskId, name } = query
    const queryFilter: RootFilterQuery<TaskMatcher> = {}

    if (taskId) {
      queryFilter.taskId = taskId
    }

    if (name) {
      queryFilter.name = name
    }

    const list = await this.taskMatcherModel
      .find(queryFilter)
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .exec()

    return {
      list,
      total: await this.taskMatcherModel.countDocuments(queryFilter),
    }
  }
}

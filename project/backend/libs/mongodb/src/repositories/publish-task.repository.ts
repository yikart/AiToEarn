import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { PublishTask } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class PublishTaskRepository extends BaseRepository<PublishTask> {
  constructor(
    @InjectModel(PublishTask.name)
    private readonly publishTaskModel: Model<PublishTask>,
  ) {
    super(publishTaskModel)
  }

  async createPublishTask(data: Partial<PublishTask>) {
    return await this.publishTaskModel.create(data)
  }

  async updatePublishTask(id: string, data: Partial<PublishTask>) {
    return await this.publishTaskModel.updateOne({ _id: id }, data)
  }

  async getPublishTask(userId: string, id: string) {
    return await this.publishTaskModel.findOne({ _id: id })
  }

  async getPublishTaskStatus(id: string) {
    return await this.publishTaskModel.findOne({ _id: id }, { status: 1 })
  }

  async getPublishTaskByDataId(dataId: string) {
    return await this.publishTaskModel.findOne({ dataId })
  }

  async getPublishTaskByTaskId(taskId: string) {
    return await this.publishTaskModel.findOne({ taskId })
  }

  async getPublishTaskByFlowId(flowId: string) {
    return await this.publishTaskModel.findOne({ flowId })
  }

  async deletePublishTask(id: string) {
    return await this.publishTaskModel.deleteOne({ _id: id })
  }

  async listPublishTasks(filter: FilterQuery<PublishTask>) {
    return await this.publishTaskModel.find(filter)
  }
}

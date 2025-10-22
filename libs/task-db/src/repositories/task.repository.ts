import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { ObjectId } from 'mongodb'
import { Model } from 'mongoose'
import { Task, TaskOpportunity } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class TaskRepository extends BaseRepository<Task> {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(TaskOpportunity.name) private taskOpportunityModel: Model<TaskOpportunity>,
  ) {
    super(taskModel)
  }

  async findOneById(id: string) {
    const task = await this.taskModel.findById(id).exec()
    return task
  }

  // 更新任务当前的接取人数
  async updateCurrentAmount(taskId: string, amount: number): Promise<boolean> {
    const res = await this.taskModel.updateOne(
      {
        _id: new ObjectId(taskId),
      },
      {
        $inc: {
          currentRecruits: amount,
        },
      },
    )

    return res.modifiedCount > 0
  }
}

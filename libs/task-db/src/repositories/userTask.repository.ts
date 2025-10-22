import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { UserTask, UserTaskStatus } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class UserTaskRepository extends BaseRepository<UserTask> {
  constructor(
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTask>,
  ) {
    super(userTaskModel)
  }

  override findOne(filter: RootFilterQuery<UserTask>) {
    return this.userTaskModel.findOne(filter).exec()
  }

  override create(newData: Partial<UserTask>) {
    return this.userTaskModel.create(newData)
  }

  async getUserTaskInfoById(id: string) {
    return this.userTaskModel.findById(id).exec()
  }

  async findUserTasks(
    page: {
      pageNo: number
      pageSize: number
    },
    query: {
      userId: string
      status?: UserTaskStatus
    },
  ) {
    const { pageNo, pageSize } = page
    const filter: RootFilterQuery<UserTask> = {
      userId: query.userId,
      ...(query.status !== undefined && { status: query.status }),
    }

    const [list, total] = await Promise.all([
      this.userTaskModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNo - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.userTaskModel.countDocuments(filter),
    ])

    return {
      list,
      total,
    }
  }

  async updateOneById(id: string, data: Partial<UserTask>): Promise<boolean> {
    const res = await this.userTaskModel.updateOne(
      {
        _id: data.id,
      },
      {
        $set: data,
      },
    )

    return res.modifiedCount > 0
  }

  /**
   * 统计任务
   * @param userId
   * @returns
   */
  async getTotalAmountOfDoingTasks(userId: string): Promise<number> {
    const tasks = await this.userTaskModel.find({
      status: UserTaskStatus.DOING,
      userId,
    })

    let totalAmount = 0

    for (const task of tasks) totalAmount += task.reward
    return totalAmount
  }

  // 更新状态
  async updateStatus(id: string, status: UserTaskStatus) {
    const res = await this.userTaskModel.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          status,
        },
        $unset: {
          rejectionReason: '',
        },
      },
    )

    return res.modifiedCount > 0
  }

  async del(id: string, verificationNote: string) {
    const res = await this.userTaskModel.updateOne(
      {
        _id: id,
      },
      {
        $set: {
          status: UserTaskStatus.DEL,
          verificationNote,
        },
      },
    )
    return res.modifiedCount > 0
  }
}

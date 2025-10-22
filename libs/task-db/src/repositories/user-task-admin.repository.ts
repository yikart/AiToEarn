import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { TableDto } from '@yikart/common'
import { Model, RootFilterQuery, Types } from 'mongoose'
import { Task, UserTask, UserTaskStatus } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class UserTaskAdminRepository extends BaseRepository<UserTask> {
  constructor(
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTask>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {
    super(userTaskModel)
  }

  async getUserTaskInfoById(id: string): Promise<UserTask | null> {
    const task = await this.userTaskModel.findById(id).exec()
    return task
  }

  async getUserTaskInfoByTaskIdOfUser(
    taskId: string,
    userId: string,
  ): Promise<UserTask | null> {
    const res = await this.userTaskModel
      .findOne({
        userId: new Types.ObjectId(userId),
        taskId: new Types.ObjectId(taskId),
      })
      .exec()

    return res
  }

  async getList(pageInfo: TableDto, query: {
    status?: UserTaskStatus
    keyword?: string
    time?: string[]
    userId?: string
    taskId?: string
    opportunityId?: string
  }) {
    const { pageNo, pageSize } = pageInfo
    const { status, keyword, time, userId, taskId, opportunityId } = query
    const filter: RootFilterQuery<UserTask> = {
      ...(userId && { userId }),
      ...(taskId && { taskId }),
      ...(opportunityId && { opportunityId }),
      ...(status !== undefined && { status }),
      ...(keyword && { title: { $regex: keyword, $options: 'i' } }),
      ...(time && {
        createdAt: {
          $gte: new Date(time[0]),
          $lte: new Date(time[1]),
        },
      }),
    }

    const res = await this.userTaskModel
      .find(filter)
      .skip((pageNo! - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .populate('taskId')
      .sort({ createdAt: -1 })
      .exec()

    return {
      list: res,
      total: await this.userTaskModel.countDocuments(filter),
    }
  }

  async verifyUserTaskApproved(
    userTask: UserTask,
    data: {
      verifierUserId?: string
      screenshotUrls?: string[]
    },
  ): Promise<boolean> {
    const task = await this.taskModel.findById(userTask.taskId)
    if (!task)
      return false

    const res = await this.userTaskModel.updateOne(
      { _id: userTask.id },
      {
        $set: {
          status: UserTaskStatus.APPROVED,
          verificationNote: '通过,并发放奖励',
          ...data,
          rewardTime: new Date(),
          reward: task.reward,
        },
      },
    )
    return res.modifiedCount > 0
  }

  async verifyUserTaskRejected(
    userTask: UserTask,
    data: {
      verifierUserId?: string
      verificationNote?: string // 人工核查备注
      rejectionReason?: string // 拒绝原因
    },
  ): Promise<boolean> {
    const res = await this.userTaskModel.updateOne(
      { _id: userTask.id },
      {
        $set: {
          status: UserTaskStatus.REJECTED,
          ...data,
        },
      },
    )

    // 该对应的任务，发布次数+1
    await this.taskModel.updateOne(
      { _id: userTask.taskId },
      {
        $inc: {
          currentRecruits: -1,
        },
      },
    )

    return res.modifiedCount > 0
  }

  async rollbackUserTaskApproved(
    userTask: UserTask,
    data: {
      verifierUserId: string
      verificationNote: string // 人工核查备注
      rejectionReason: string // 拒绝原因
    },
  ): Promise<boolean> {
    const res = await this.userTaskModel.updateOne(
      { _id: userTask.id },
      {
        $set: {
          status: UserTaskStatus.DEL,
          ...data,
          verificationNote: '任务撤回,并扣除余额',
        },
      },
    )

    // 该对应的任务，发布次数+1
    await this.taskModel.updateOne(
      { _id: userTask.taskId },
      {
        $inc: {
          currentRecruits: -1,
        },
      },
    )

    return res.modifiedCount > 0
  }

  getCompletedTaskCount() {
    return this.userTaskModel.countDocuments({
      status: UserTaskStatus.APPROVED,
    })
  }

  async getCompletedUserCount(): Promise<number> {
    const result = await this.userTaskModel
      .aggregate([
        { $match: { status: UserTaskStatus.APPROVED } },
        { $group: { _id: '$userId' } },
        { $count: 'uniqueUsers' },
      ])
      .exec()
    return result[0]?.uniqueUsers || 0
  }

  async updateUserTaskAutoStatus(
    userTaskId: string,
    data: { status: 0 | 1, message: string },
  ): Promise<boolean> {
    const res = await this.userTaskModel.updateOne(
      { _id: userTaskId },
      {
        $set: {
          autoData: data,
        },
      },
    )

    return res.modifiedCount > 0
  }
}

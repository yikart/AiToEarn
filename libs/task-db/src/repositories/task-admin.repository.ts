import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, RootFilterQuery } from 'mongoose'
import { Task, TaskStatus, TaskType } from '../schemas'
import { BaseRepository } from './base.repository'

@Injectable()
export class TaskAdminRepository extends BaseRepository<Task> {
  logger = new Logger(TaskAdminRepository.name)

  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {
    super(taskModel)
  }

  override async create(data: Partial<Task>) {
    const createdTask = new this.taskModel({
      ...data,
    })
    const res = await createdTask.save()
    return res
  }

  async update(id: string, data: Partial<Task>): Promise<Task> {
    const updatedTask = await this.taskModel.findByIdAndUpdate(id, { $set: data }).exec()
    if (!updatedTask)
      throw new NotFoundException('Task not found')
    return updatedTask
  }

  /**
   * 删除任务素材
   * @param id
   * @param materialId
   * @returns
   */
  async deleteTaskMaterial(id: string, materialId: string): Promise<boolean> {
    const res = await this.taskModel.updateOne(
      { _id: id },
      {
        $pull: {
          materialIds: materialId,
        },
      },
    )

    return res.modifiedCount > 0
  }

  /**
   * 添加任务素材
   * @param id
   * @param materialIds
   * @returns
   */
  async addMaterial(id: string, materialIds: string[]): Promise<boolean> {
    const res = await this.taskModel.updateOne(
      { _id: id },
      {
        $push: {
          materialIds,
        },
      },
    )

    return res.modifiedCount > 0
  }

  async findAll(pageInfo: {
    pageSize: number
    pageNo: number
  }, query: {
    type?: TaskType
    keyword?: string
    status?: TaskStatus
    startDate?: Date
    endDate?: Date
  }) {
    const { pageSize, pageNo } = pageInfo
    const { type, keyword, status } = query
    const filter: RootFilterQuery<Task> = {
      ...(status !== undefined && { status }),
      ...(keyword !== undefined && {
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
        ],
      }),
      ...(type !== undefined && { type }),
    }

    const [total, list] = await Promise.all([
      this.taskModel.countDocuments(filter),
      this.taskModel
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

  async findOneById(id: string) {
    const task = await this.taskModel.findById(id).exec()
    return task
  }

  /**
   * 更新任务状态
   * @param id
   * @param status
   * @returns
   */
  async updateStatus(id: string, status: TaskStatus): Promise<boolean> {
    const res = await this.taskModel.updateOne(
      { _id: id },
      {
        $set: { status },
      },
    )

    return res.modifiedCount > 0
  }

  /**
   * 更新任务状态
   * @param id
   * @param data
   * @returns
   */
  async updateAutoDeleteMaterial(id: string, data: boolean): Promise<boolean> {
    const res = await this.taskModel.updateOne(
      { _id: id },
      {
        $set: { autoDeleteMaterial: data },
      },
    )

    return res.modifiedCount > 0
  }

  /**
   * 删除任务
   * @param id
   * @returns
   */
  async delTask(id: string): Promise<boolean> {
    const res = await this.taskModel.updateOne(
      { _id: id },
      {
        status: TaskStatus.DEL,
      },
    )

    return res.modifiedCount > 0
  }

  findById(id: string) {
    return this.taskModel.findById(id).exec()
  }

  async findToNewUserTask(num = 10) {
    const filter: RootFilterQuery<Task> = {
      status: TaskStatus.ACTIVE,
      autoDispatch: true,
      $expr: {
        $gt: [
          { $subtract: ['$maxRecruits', '$currentRecruits'] },
          0,
        ],
      },
      deadline: { $gt: new Date() },
    }

    const list = await this.taskModel
      .find(filter)
      .sort({ createdAt: 1 })
      .limit(num)
      .exec()

    return list
  }
}

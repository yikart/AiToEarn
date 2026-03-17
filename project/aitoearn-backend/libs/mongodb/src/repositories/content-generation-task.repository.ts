import { InjectModel } from '@nestjs/mongoose'
import { Pagination } from '@yikart/common'
import { FilterQuery, Model } from 'mongoose'
import { ContentGenerationTaskStatus } from '../enums'
import { ContentGenerationTask, TaskAnalysis } from '../schemas'
import { BaseRepository, LeanDoc } from './base.repository'

export interface ListContentGenerationTaskParams extends Pagination {
  userId?: string
  taskId?: string
  status?: ContentGenerationTaskStatus
  minRating?: number
  maxRating?: number
  hasRating?: boolean
}

export interface GetUserTasksParams extends Pagination {
  keyword?: string
  favoriteOnly?: boolean
}

export class ContentGenerationTaskRepository extends BaseRepository<ContentGenerationTask> {
  constructor(
    @InjectModel(ContentGenerationTask.name) contentGenerationTaskModel: Model<ContentGenerationTask>,
  ) {
    super(contentGenerationTaskModel)
  }

  override async create(data: Partial<ContentGenerationTask>) {
    const doc = await this.model.create(data)
    return doc.toObject() as LeanDoc<ContentGenerationTask>
  }

  async getUserTask(userId: string, taskId: string) {
    return await this.findOne({ userId, _id: taskId, deletedAt: null })
  }

  async getByUserIdAndId(userId: string, taskId: string) {
    return await this.getUserTask(userId, taskId)
  }

  async updateMessage(taskId: string, message: Record<string, unknown>) {
    return await this.model.findByIdAndUpdate(
      taskId,
      { $push: { messages: message } },
      { new: true },
    ).lean({ virtuals: true }).exec()
  }

  async getMessages(taskId: string) {
    const task = await this.getById(taskId)
    return task?.messages || []
  }

  async getByMessageUuid(messageUuid: string) {
    return await this.findOne({
      messages: {
        $elemMatch: {
          uuid: messageUuid,
        },
      },
    })
  }

  /**
   * Find a task by its public share token.
   * @param token share token
   */
  async findByPublicShareToken(token: string) {
    return await this.findOne({ publicShareToken: token, deletedAt: null })
  }

  async getUserTasksWithPagination(userId: string, params: GetUserTasksParams) {
    const { page, pageSize, keyword, favoriteOnly } = params
    const filter: FilterQuery<ContentGenerationTask> = { userId, deletedAt: null }

    if (keyword) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = { $regex: escapedKeyword, $options: 'i' }
      filter.$or = [
        { title: regex },
        { 'messages.content': regex },
        { 'messages.content.text': regex },
        { 'messages.message.content.text': regex },
      ]
    }

    if (favoriteOnly === true) {
      filter.favoritedAt = { $ne: null }
    }

    const [items, total] = await this.findWithPagination({
      page,
      pageSize,
      filter,
      options: { sort: { createdAt: -1 } },
    })
    return [items, total] as const
  }

  async updateFavoriteById(taskId: string, favoritedAt: Date | null) {
    return await this.model.findByIdAndUpdate(
      taskId,
      { $set: { favoritedAt } },
      { new: true },
    ).lean({ virtuals: true }).exec()
  }

  async listWithPagination(params: ListContentGenerationTaskParams) {
    const { page, pageSize, userId, taskId, status, minRating, maxRating, hasRating } = params

    const filter: FilterQuery<ContentGenerationTask> = {
      deletedAt: null,
    }

    if (userId) {
      filter.userId = userId
    }

    if (taskId) {
      filter._id = taskId
    }

    if (status) {
      filter.status = status
    }

    // Rating 筛选逻辑
    if (minRating !== undefined || maxRating !== undefined) {
      filter.rating = {}
      if (minRating !== undefined) {
        filter.rating.$gte = minRating
      }
      if (maxRating !== undefined) {
        filter.rating.$lte = maxRating
      }
    }
    else if (hasRating !== undefined) {
      if (hasRating) {
        filter.rating = { $exists: true, $ne: null }
      }
      else {
        filter.$or = [
          { rating: { $exists: false } },
          { rating: null },
        ]
      }
    }

    const [items, total] = await this.findWithPagination({
      page,
      pageSize,
      filter,
      projection: {
        messages: false,
      },
      options: {
        sort: { createdAt: -1 },
      },
    })
    return [items, total] as const
  }

  async updateStatus(taskId: string, status: ContentGenerationTaskStatus) {
    return await this.model.findByIdAndUpdate(
      taskId,
      { $set: { status } },
      { new: true },
    ).lean({ virtuals: true }).exec()
  }

  async softDeleteTask(userId: string, taskId: string) {
    const res = await this.model.updateOne(
      { _id: taskId, userId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    ).exec()
    return res.modifiedCount > 0
  }

  async getActiveUserTotal(startDate: Date, endDate: Date) {
    const result = await this.model.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$userId', total: { $sum: 1 } } },
    ])
    return result.length
  }

  /**
   * 查询所有状态为 Running 且 updatedAt 超过指定时间的任务
   * @param timeoutMs 超时时间（毫秒），默认 30 分钟
   */
  async listTimeoutRunningTasks(timeoutMs: number = 30 * 60 * 1000) {
    const timeoutDate = new Date(Date.now() - timeoutMs)
    return await this.model.find({
      status: ContentGenerationTaskStatus.Running,
      updatedAt: { $lt: timeoutDate },
      deletedAt: null,
    }).lean({ virtuals: true }).exec()
  }

  /**
   * 批量更新任务状态
   * @param taskIds 任务 ID 数组
   * @param status 新状态
   */
  async batchUpdateStatus(taskIds: string[], status: ContentGenerationTaskStatus) {
    if (taskIds.length === 0) {
      return { modifiedCount: 0 }
    }
    return await this.model.updateMany(
      { _id: { $in: taskIds } },
      { $set: { status } },
    ).exec()
  }

  /**
   * 获取最新的任务（不含messages），按时间倒序，最多1000条
   */
  async getTasksByDateRange(startDate: Date, endDate: Date) {
    return await this.model.find({
      createdAt: { $gte: startDate, $lte: endDate },
      // status: ContentGenerationTaskStatus.Error,
    })
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean({ virtuals: true })
      .exec()
  }

  /**
   * 更新任务分析结果
   */
  async updateAnalysisById(taskId: string, analysis: TaskAnalysis) {
    return await this.model.findByIdAndUpdate(
      taskId,
      { $set: { analysis } },
      { new: true },
    ).lean({ virtuals: true }).exec()
  }

  async listUnanalyzedByDateRange(startDate: Date, endDate: Date) {
    return await this.model.find({
      createdAt: { $gte: startDate, $lte: endDate },
      deletedAt: null,
      status: ContentGenerationTaskStatus.Completed,
      $or: [
        { analysis: { $exists: false } },
        { analysis: null },
      ],
    }).select('_id userId').lean({ virtuals: true }).exec()
  }

  async aggregateIssuesByDateRange(startDate: Date, endDate: Date) {
    return await this.model.aggregate([
      {
        $match: {
          'createdAt': { $gte: startDate, $lte: endDate },
          'deletedAt': null,
          'analysis.optimizations': { $exists: true, $ne: [] },
        },
      },
      { $unwind: '$analysis.optimizations' },
      {
        $project: {
          issue: '$analysis.optimizations.issue',
          priority: '$analysis.optimizations.priority',
        },
      },
    ]).exec()
  }

  async countAnalyzedByDateRange(startDate: Date, endDate: Date): Promise<number> {
    return await this.model.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      deletedAt: null,
      analysis: { $ne: null },
    }).exec()
  }
}

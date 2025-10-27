/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-02-27 22:43:33
 * @LastEditors: nevin
 * @Description: 用户端任务
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskStatus } from '../../db/schema/task.schema';
import { UserTask, UserTaskStatus } from '../../db/schema/user-task.schema';
import { QueryTaskDto } from './dto/query-task.dto';
import { createPaginationObject } from 'src/common/paginate/create-pagination';
import { ObjectId } from 'mongodb';
import { TaskMaterial } from 'src/db/schema/taskMaterial.schema';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTask>,
    @InjectModel(TaskMaterial.name)
    private taskMaterialModel: Model<TaskMaterial>,
  ) {}

  /**
   * 获取任务列表
   * @param query
   * @returns
   */
  async findAll(userId: string, query: QueryTaskDto) {
    const {
      page = 1,
      pageSize = 10,
      type,
      keyword,
      productLevel,
      requiresShoppingCart,
    } = query;
    const filter: any = {
      status: TaskStatus.ACTIVE,
    };

    if (type) filter.type = type;
    if (productLevel) filter.productLevel = productLevel;
    if (requiresShoppingCart !== undefined)
      filter.requiresShoppingCart = requiresShoppingCart;
    if (keyword) filter.title = new RegExp(keyword, 'i');

    const listP = this.taskModel.aggregate([
      {
        $match: {
          ...filter,
        },
      },
      {
        $lookup: {
          from: 'user_task', // 连接 user_task 表
          let: { task_id: '$_id' }, // 定义变量 task_id 为当前任务的 _id
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$taskId', '$$task_id'] }, // 匹配 taskId
                    { $eq: ['$userId', new Types.ObjectId(userId)] }, // 匹配 userId
                  ],
                },
              },
            },
          ],
          as: 'accepted_info', // 将匹配的结果存放到 user_tasks 字段中
        },
      },
      {
        $addFields: {
          isAccepted: {
            $cond: {
              if: { $gt: [{ $size: '$accepted_info' }, 0] }, // 如果 accepted_info 数组不为空
              then: true, // 则 is_accepted 为 true
              else: false, // 否则为 false
            },
          },
        },
      },
      {
        $project: {
          accepted_info: 0, // 移除 accepted_info 字段（可选）
        },
      },
      { $skip: (page - 1) * pageSize }, // 跳过前面的记录
      { $limit: pageSize }, // 限制每页的记录数量
    ]);

    const totaP = this.taskModel.countDocuments(filter);
    const [items, total] = await Promise.all([listP, totaP]);

    return createPaginationObject<Task>({
      items,
      totalItems: total,
      currentPage: page,
      limit: pageSize,
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  // 统计合计进行中的任务的金额总数
  async getTotalAmountOfDoingTasks(userId: string): Promise<number> {
    const tasks = await this.userTaskModel.find({
      status: UserTaskStatus.APPROVED,
      userId: new ObjectId(userId),
    });

    let totalAmount = 0;

    for (const task of tasks) totalAmount += task.reward;
    return totalAmount;
  }

  // 根据ID获取素材
  async getTaskMaterialById(taskMaterialId: string): Promise<TaskMaterial> {
    const materials = await this.taskMaterialModel.findById(taskMaterialId);
    return materials;
  }

  /**
   * 获取最优素材
   * @param taskId
   * @returns
   */
  async getFristTaskMaterial(taskId: string) {
    const res = await this.taskMaterialModel
      .findOne({
        taskId: new ObjectId(taskId),
      })
      .sort({ usedCount: 1 });

    return res;
  }

  // 素材使用次数+1
  async upTaskMaterialUsedCount(taskMaterialId: string): Promise<boolean> {
    try {
      const res = await this.taskMaterialModel.updateOne(
        { _id: new ObjectId(taskMaterialId) },
        { $inc: { usedCount: 1 } },
      );

      return res.modifiedCount > 0;
    } catch (error) {
      console.log(
        '----------- upTaskMaterialUsedCount error -----------',
        error,
      );

      return false;
    }
  }
}

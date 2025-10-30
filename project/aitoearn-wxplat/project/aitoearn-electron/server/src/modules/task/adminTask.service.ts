/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-04-27 17:55:50
 * @LastEditors: nevin
 * @Description:
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { paginateModel } from '../../common/paginate/create-pagination';
import {
  Task,
  TaskFile,
  TaskStatus,
  TaskType,
} from '../../db/schema/task.schema';
import { UserTask } from '../../db/schema/user-task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/task.dto';
import { TaskMaterial } from 'src/db/schema/taskMaterial.schema';
import { ActionTaskMaterialDto } from './dto/adminTask.dto';
import { PagerDto } from 'src/common/dto/pager.dto';
import { AppHttpException } from 'src/filters/http-exception.filter';
import { ErrHttpBack } from 'src/filters/http-exception.back-code';

@Injectable()
export class AdminTaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTask>,
    @InjectModel(TaskMaterial.name)
    private taskMaterialModel: Model<TaskMaterial>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const createdTask = new this.taskModel({
      ...createTaskDto,
      keepTime: 5 * 60, // TODO: 先暂时默认为5分钟
    });
    return createdTask.save();
  }

  /**
   * 获取任务列表
   * @param query
   * @returns
   */
  async findAll(query: QueryTaskDto) {
    const {
      page = 1,
      pageSize = 10,
      type,
      keyword,
      productLevel,
      requiresShoppingCart,
      status,
    } = query;
    const filter: any = {};

    if (type) filter.type = type;
    if (productLevel) filter.productLevel = productLevel;
    if (requiresShoppingCart !== undefined)
      filter.requiresShoppingCart = requiresShoppingCart;
    if (keyword) filter.title = new RegExp(keyword, 'i');
    if (status !== undefined) filter.status = status;

    return paginateModel(
      this.taskModel,
      {
        page,
        pageSize,
      },
      filter,
      undefined,
      { _id: -1 },
    );
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    const updatedTask = await this.taskModel.findByIdAndUpdate(id, data).exec();
    if (!updatedTask) throw new NotFoundException('Task not found');
    return updatedTask;
  }

  /**
   * 更新任务状态
   * @param task
   * @param status
   * @returns
   */
  async updateStatus(task: Task, status: TaskStatus): Promise<Task> {
    if (status === TaskStatus.ACTIVE && task.type === TaskType.ARTICLE) {
      // 查询是否存在任务的素材
      const material = await this.taskMaterialModel.findOne({
        taskId: task.id,
      });

      if (!material) throw new AppHttpException(ErrHttpBack.task_no_material);
    }

    const res = await this.taskModel.findByIdAndUpdate(
      { _id: task.id },
      {
        status,
      },
    );

    return res;
  }

  /**
   * 更新任务状态
   * @param id
   * @param status
   * @returns
   */
  async delTask(id: string): Promise<Task> {
    const res = await this.taskModel.findByIdAndUpdate(id, {
      status: TaskStatus.DEL,
    });

    return res;
  }

  // 添加任务文件
  async addTaskFile(id: string, file: TaskFile): Promise<TaskFile[]> {
    const res = await this.taskModel.findByIdAndUpdate(id, {
      $push: {
        fileList: file,
      },
    });
    return res.fileList;
  }

  // 删除任务文件
  async deleteTaskFile(id: string, file: TaskFile): Promise<TaskFile[]> {
    const res = await this.taskModel.findByIdAndUpdate(id, {
      $pull: {
        fileList: file,
      },
    });
    return res.fileList;
  }

  /**
   * 获取任务素材列表
   * @param query
   * @returns
   */
  async findTaskMaterialList(taskId: string, query: PagerDto) {
    const { page = 1, pageSize = 10 } = query;
    return paginateModel(
      this.taskMaterialModel,
      {
        page,
        pageSize,
      },
      {
        taskId,
      },
      undefined,
      { usedCount: 1 },
    );
  }

  /**
   * 创建任务素材
   * @param data
   * @returns
   */
  async createTaskMaterial(data: ActionTaskMaterialDto): Promise<TaskMaterial> {
    const taskMaterial = new this.taskMaterialModel(data);
    return taskMaterial.save();
  }

  /**
   * 更新任务素材
   * @param data
   * @returns
   */
  async upTaskMaterial(
    id: string,
    data: ActionTaskMaterialDto,
  ): Promise<boolean> {
    const res = await this.taskMaterialModel.updateOne({ _id: id }, data);
    return res.modifiedCount > 0;
  }

  // 根据ID获取
  async getTaskMaterialById(id: string): Promise<TaskMaterial> {
    return this.taskMaterialModel.findById(id);
  }

  /**
   * 删除任务素材
   * @param id
   * @returns
   */
  async deleteTaskMaterial(id: string): Promise<TaskMaterial> {
    const res = await this.taskMaterialModel.findByIdAndDelete(id);
    return res;
  }
}

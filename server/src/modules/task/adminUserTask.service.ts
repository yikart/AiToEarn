import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery, Types } from 'mongoose';
import { paginateModel } from '../../common/paginate/create-pagination';
import { Task, TaskType } from '../../db/schema/task.schema';
import { UserTask, UserTaskStatus } from '../../db/schema/user-task.schema';
import { QueryVerificationDto } from './dto/query-verification.dto';
import { AdminQueryUserTaskDto } from './dto/userTask.dto';
import { FinanceService } from '../finance/finance.service';
import { UserTaskService } from './user-task.service';
import { TaskService } from './task.service';
import { TaskUtilService } from './util.service';
import { AccountType } from '../../db/schema/account.schema';

@Injectable()
export class AdminUserTaskService {
  constructor(
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTask>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    private readonly financeService: FinanceService,
    readonly userTaskService: UserTaskService,
    readonly taskUtilService: TaskUtilService,
    readonly taskService: TaskService,
  ) {}

  async getUserTaskInfoById(id: string): Promise<UserTask> {
    const task = await this.userTaskModel.findById(id).exec();
    return task;
  }

  async getUserTaskInfoByTaskIdOfUser(
    taskId: string,
    userId: string,
  ): Promise<UserTask> {
    const res = await this.userTaskModel
      .findOne({
        userId: new Types.ObjectId(userId),
        taskId: new Types.ObjectId(taskId),
      })
      .exec();
    return res;
  }

  /**
   * 获取用户的任务列表
   * @param query
   * @returns
   */
  async getList(query: AdminQueryUserTaskDto) {
    const { page, pageSize, status, keyword, time } = query;
    const filter: RootFilterQuery<UserTask> = {
      ...(status !== undefined && { status }),
      ...(keyword && { title: { $regex: keyword, $options: 'i' } }),
      ...(time && {
        createdAt: {
          $gte: new Date(time[0]),
          $lte: new Date(time[1]),
        },
      }),
    };

    return paginateModel(
      this.userTaskModel,
      {
        page,
        pageSize,
      },
      filter,
      'taskId',
      { _id: -1 },
    );
  }

  /**
   * 获取任务列表进行审核
   * @param query
   * @returns
   */
  async getTasksForVerification(query: QueryVerificationDto) {
    const { page = 1, pageSize = 10, status } = query;

    const filter: any = {};
    if (status) filter.status = status;

    return paginateModel(
      this.userTaskModel,
      {
        page,
        pageSize,
      },
      filter,
      'taskId',
      { _id: -1 },
    );
  }

  /**
   * 验证任务-通过
   * @param userTask
   * @returns
   */
  async verifyUserTaskApproved(
    userTask: UserTask,
    data: {
      verifierUserId?: string;
    },
  ): Promise<boolean> {
    const task = await this.taskModel.findById(userTask.taskId);
    if (!task) return false;

    const res = await this.userTaskModel.updateOne(
      { _id: userTask.id },
      {
        $set: {
          status: UserTaskStatus.APPROVED,
          verificationNote: '审核通过',
          ...data,
          rewardTime: new Date(),
          reward: task.reward,
        },
      },
    );

    // 更新用户余额
    await this.financeService.updateUserWalletBalance(
      userTask.userId,
      task.reward,
    );

    return res.modifiedCount > 0;
  }

  /**
   * 验证任务-拒绝
   * @param userTask
   * @returns
   */
  async verifyUserTaskRejected(
    userTask: UserTask,
    data: {
      verifierUserId?: string;
      verificationNote?: string; // 人工核查备注
    },
  ): Promise<boolean> {
    if (userTask.status === UserTaskStatus.PENDING) return false;

    const res = await this.userTaskModel.updateOne(
      { _id: userTask.id },
      {
        $set: {
          status: UserTaskStatus.REJECTED,
          ...data,
        },
      },
    );

    // 该对应的任务，发布次数+1
    await this.taskModel.updateOne(
      { _id: userTask.taskId },
      {
        $inc: {
          currentRecruits: +1,
        },
      },
    );

    return res.modifiedCount > 0;
  }

  /**
   * 验证任务-回退
   * @param userTask
   * @returns
   */
  async rollbackUserTaskApproved(
    userTask: UserTask,
    data: {
      verifierUserId: string;
      verificationNote: string; // 人工核查备注
    },
  ): Promise<boolean> {
    const task = await this.taskModel.findById(userTask.taskId);
    if (!task) return false;

    const res = await this.userTaskModel.updateOne(
      { _id: userTask.id },
      {
        $set: {
          status: UserTaskStatus.DEL,
          verificationNote: '任务撤回,并扣除余额',
          ...data,
        },
      },
    );

    // 更新用户余额
    await this.financeService.updateUserWalletBalance(
      userTask.userId,
      -task.reward,
    );

    // 该对应的任务，发布次数+1
    await this.taskModel.updateOne(
      { _id: userTask.taskId },
      {
        $inc: {
          currentRecruits: +1,
        },
      },
    );

    return res.modifiedCount > 0;
  }

  // 获取已完成任务的总数
  getCompletedTaskCount() {
    return this.userTaskModel.countDocuments({
      status: UserTaskStatus.APPROVED,
    });
  }

  // 获取完成过任务的用户总数
  async getCompletedUserCount(): Promise<number> {
    const result = await this.userTaskModel
      .aggregate([
        { $match: { status: UserTaskStatus.APPROVED } },
        { $group: { _id: '$userId' } },
        { $count: 'uniqueUsers' },
      ])
      .exec();
    return result[0]?.uniqueUsers || 0;
  }

  /**
   * 自动审核
   * @param userTaskId
   */
  async autoAuditTask(userTaskId: string): Promise<{
    status: 0 | 1; // 0:成功 1:失败
    message: string;
    retry: boolean;
    data?: boolean;
  }> {
    const userTaskInfo =
      await this.userTaskService.getUserTaskInfoById(userTaskId);
    if (!userTaskInfo)
      return {
        status: 0,
        message: '用户任务不存在',
        retry: false,
      };

    if (userTaskInfo.status !== UserTaskStatus.PENDING)
      return {
        status: 0,
        message: '用户任务状态错误',
        retry: false,
      };

    const taskInfo = await this.taskService.findOne(
      userTaskInfo.taskId.toString(),
    );
    if (!taskInfo)
      return {
        status: 0,
        message: '任务不存在',
        retry: false,
      };

    // 获取使用的素材信息
    const taskMaterialInfo = await this.taskService.getTaskMaterialById(
      userTaskInfo.taskMaterialId,
    );
    if (!taskMaterialInfo)
      return {
        status: 0,
        message: '素材信息不存在',
        retry: false,
      };

    if (
      taskInfo.type === TaskType.ARTICLE &&
      userTaskInfo.accountType === AccountType.Xhs
    ) {
      // 对比文本内容
      const { status: contentCheckStatus, extent } =
        await this.taskUtilService.articleXhsContentCheck(
          taskMaterialInfo.desc,
          userTaskInfo.submissionUrl,
        );

      if (contentCheckStatus === 0) {
        return {
          status: 0,
          message: '内容检测失败，请重试',
          retry: true,
        };
      }

      if (extent <= 0.8) {
        return {
          status: 1,
          message: '内容相似度小于80%，请重新提交',
          retry: false,
          data: false,
        };
      }

      // 进行奖励发放
      const res = await this.verifyUserTaskApproved(userTaskInfo, {});
      if (!res) {
        return {
          status: 0,
          message: '自动审核或发放奖励失败，请重试',
          retry: true,
        };
      }

      return {
        status: 1,
        message: '成功',
        retry: false,
        data: true,
      };
    }
  }

  // 更新用户任务自动状态
  async updateUserTaskAutoStatus(
    userTaskId: string,
    data: { status: 0 | 1; message: string },
  ): Promise<boolean> {
    const res = await this.userTaskModel.updateOne(
      { _id: userTaskId },
      {
        $set: {
          autoData: data,
        },
      },
    );

    return res.modifiedCount > 0;
  }
}

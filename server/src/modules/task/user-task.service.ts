import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { paginateModel } from '../../common/paginate/create-pagination';
import { Task } from '../../db/schema/task.schema';
import { UserTask, UserTaskStatus } from '../../db/schema/user-task.schema';
import { QueryVerificationDto } from './dto/query-verification.dto';
import { QueryMineTaskDto } from './dto/query-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { ApplyTaskDto } from './dto/applyTask.dto';

@Injectable()
export class UserTaskService {
  constructor(
    @InjectModel(UserTask.name) private userTaskModel: Model<UserTask>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
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
   * 用户接受任务
   * @param userId
   * @param taskId
   * @returns
   */
  async userApplyTask(
    userId: string,
    task: Task,
    account: ApplyTaskDto,
  ): Promise<{
    code: number;
    msg: string;
    data: UserTask;
  }> {
    const res = {
      code: 0,
      msg: '任务申请中',
      data: null,
    };

    // 最大人数
    if (task.currentRecruits >= task.maxRecruits) {
      res.msg = '该任务已超过最大人数';
      return res;
    }

    const session = await this.userTaskModel.db.startSession();
    session.startTransaction();

    try {
      const oldUserTask = await this.userTaskModel
        .findOne({
          userId: new Types.ObjectId(userId),
          taskId: new Types.ObjectId(task.id),
          ...account,
        })
        .session(session);

      if (!!oldUserTask) {
        res.msg = '你已经用该账号接受过该任务';
        return res;
      }

      // 创建
      const userTask = new this.userTaskModel({
        userId: new Types.ObjectId(userId),
        taskId: new Types.ObjectId(task.id),
        status: UserTaskStatus.DODING,
        isFirstTimeSubmission: true,
        reward: task.reward,
        ...account,
      });

      // Increment current recruits and applicant count
      await this.taskModel
        .findByIdAndUpdate(task.id, {
          $inc: {
            currentRecruits: 1,
            applicantCount: 1,
          },
        })
        .session(session);

      const newData = await userTask.save({ session });

      await session.commitTransaction();
      session.endSession();

      return {
        code: 0,
        msg: '任务申请完成',
        data: newData,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * 提交任务
   * @param userTask
   * @param data
   * @returns
   */
  async submitTask(userTask: UserTask, data: SubmitTaskDto): Promise<UserTask> {
    const userTaskD = await this.userTaskModel.findById(userTask.id);

    // 只有拒绝和进行中的才能提交
    if (
      ![UserTaskStatus.REJECTED, UserTaskStatus.DODING].includes(
        userTask.status,
      )
    ) {
      throw new BadRequestException('Cannot submit task in current status');
    }

    userTaskD.submissionUrl = data.submissionUrl;
    userTaskD.screenshotUrls = data.screenshotUrls;
    userTaskD.qrCodeScanResult = data.qrCodeScanResult;
    userTaskD.submissionTime = new Date();
    userTaskD.status = UserTaskStatus.PENDING;

    // 保存
    return userTaskD.save();
  }

  /**
   *  获取用户的任务列表
   * @param userId
   * @param query
   * @returns
   */
  async getUserTasks(userId: string, query: QueryMineTaskDto) {
    const { page, pageSize, status } = query;
    const filter: any = { userId: new Types.ObjectId(userId) };

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
      ['taskId', 'userId'],
      { _id: -1 },
    );
  }

  // TODO: 定时任务,每天凌晨1点清理过期的用户任务,并补充回任务的剩余量
  // @Cron('0 1 * * *')
  async clearExpiredUserTasks() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const expiredUserTasks = await this.userTaskModel.find({
      status: UserTaskStatus.DODING,
      createdAt: { $lt: oneDayAgo },
    });

    for (const userTask of expiredUserTasks) {
      if (
        userTask.createTime.getTime() + userTask.keepTime * 1000 >
        now.getTime()
      )
        continue;

      const task = await this.taskModel.findById(userTask.taskId);
      if (task) {
        task.currentRecruits += 1;
        await task.save();
      }
      // 删除过期的用户任务
      await this.userTaskModel.findByIdAndDelete(userTask._id);
    }
  }
}

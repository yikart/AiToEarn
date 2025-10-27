/*
 * @Author: nevin
 * @Date: 2025-02-20 16:23:34
 * @LastEditTime: 2025-05-06 14:19:19
 * @LastEditors: nevin
 * @Description: 管理端-用户任务管理
 */
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { Manager } from '../../auth/manager.guard';
import { AdminUserTaskService } from './adminUserTask.service';
import { AdminQueryUserTaskDto } from './dto/userTask.dto';
import { ApiResult } from 'src/common/decorators/api-result.decorator';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { GetToken } from 'src/auth/auth.guard';
import { UserTaskStatus } from 'src/db/schema/user-task.schema';
import { AppHttpException } from 'src/filters/http-exception.filter';
import { ErrHttpBack } from 'src/filters/http-exception.back-code';
import { RejectedTaskDto } from './dto/verify-task.dto';
import { UserTaskService } from './user-task.service';

@Controller('admin/userTasks')
@Manager()
export class AdminUserTaskController {
  constructor(
    private readonly adminUserTaskService: AdminUserTaskService,
    private readonly userTaskService: UserTaskService,
  ) {}

  @Get('list')
  async getTasks(@Query() query: AdminQueryUserTaskDto) {
    return this.adminUserTaskService.getList(query);
  }

  @Get('info/:id')
  async getTask(@Param('id') id: string) {
    return this.adminUserTaskService.getUserTaskInfoById(id);
  }

  @Get('count/approved/task')
  async getCompletedTaskCount() {
    return this.adminUserTaskService.getCompletedTaskCount();
  }

  @Get('count/approved/user')
  async getCompletedUserCount() {
    return this.adminUserTaskService.getCompletedUserCount();
  }

  // 通过
  @ApiResult({ type: Boolean })
  @Put('verify/approved/:id')
  async verifyUserTaskApproved(
    @GetToken() verifier: TokenInfo,
    @Param('id') id: string,
  ) {
    const userTask = await this.userTaskService.getUserTaskInfoById(id);
    if (!userTask) throw new NotFoundException('任务不存在');
    if (userTask.status !== UserTaskStatus.PENDING)
      throw new AppHttpException(ErrHttpBack.user_task_err_status);

    return this.adminUserTaskService.verifyUserTaskApproved(userTask, {
      verifierUserId: verifier.id,
    });
  }

  // 拒绝
  @ApiResult({ type: Boolean })
  @Put('verify/rejected/:id')
  async verifyUserTaskRejected(
    @GetToken() verifier: TokenInfo,
    @Param('id') id: string,
    @Body() data: RejectedTaskDto,
  ) {
    const userTask = await this.userTaskService.getUserTaskInfoById(id);
    if (!userTask) throw new NotFoundException('任务不存在');
    return this.adminUserTaskService.verifyUserTaskRejected(userTask, {
      verifierUserId: verifier.id,
      ...data,
    });
  }

  @ApiResult({ type: Boolean })
  @Put('rollback/rejected/:id')
  async rollbackUserTaskApproved(
    @GetToken() verifier: TokenInfo,
    @Param('id') id: string,
    @Body() data: RejectedTaskDto,
  ) {
    const userTask = await this.userTaskService.getUserTaskInfoById(id);
    if (!userTask) throw new NotFoundException('任务不存在');
    if (userTask.status !== UserTaskStatus.PENDING)
      throw new NotFoundException('任务不存在或状态不正确');

    return this.adminUserTaskService.rollbackUserTaskApproved(userTask, {
      verifierUserId: verifier.id,
      ...data,
    });
  }

  // 运行自动审核的任务
  @ApiResult({ type: Boolean })
  @Put('audit/auto/run/:id')
  async runUserTaskAuditAuto(@Param('id') id: string) {
    const userTaskInfo =
      await this.adminUserTaskService.getUserTaskInfoById(id);
    if (!userTaskInfo) throw new NotFoundException('任务不存在或状态不正确');

    const { status, message, retry, data } =
      await this.adminUserTaskService.autoAuditTask(id);

    this.adminUserTaskService.updateUserTaskAutoStatus(id, { status, message });

    if (!status)
      return {
        status,
        message,
        retry,
      };

    // 根据审核状态确定是否通过
    if (data) {
      this.adminUserTaskService.verifyUserTaskApproved(userTaskInfo, {});
    } else {
      this.adminUserTaskService.verifyUserTaskRejected(userTaskInfo, {
        verificationNote: `人工触发自动审核---${message}`,
      });
    }

    return {
      status: true,
      message: '审核成功',
    };
  }
}

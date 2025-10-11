/*
 * @Author: nevin
 * @Date: 2025-02-18 22:32:02
 * @LastEditTime: 2025-05-06 13:47:50
 * @LastEditors: nevin
 * @Description:
 */
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetToken, Public } from '../../auth/auth.guard';
import { TokenInfo } from '../../auth/interfaces/auth.interfaces';
import { ApiResult } from '../../common/decorators/api-result.decorator';
import { Task } from '../../db/schema/task.schema';
import { QueryMineTaskDto, QueryTaskDto } from './dto/query-task.dto';
import { TaskService } from './task.service';
import { UserTaskService } from './user-task.service';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { UserTaskStatus } from 'src/db/schema/user-task.schema';
import { FinanceService } from '../finance/finance.service';
import {
  UserWalletRecordStatus,
  UserWalletRecordType,
} from 'src/db/schema/userWalletRecord.shema';
import { AppHttpException } from 'src/filters/http-exception.filter';
import { ErrHttpBack } from 'src/filters/http-exception.back-code';
import { ApplyTaskDto } from './dto/applyTask.dto';
import { TaskMaterial } from 'src/db/schema/taskMaterial.schema';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
@ApiTags('tasks - 任务')
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly userTaskService: UserTaskService,
    private readonly financeService: FinanceService,
    @InjectQueue('bull_aotu_task_audit') private bullTaskAuditQueue: Queue,
  ) {}

  @Get('list')
  @ApiOperation({ summary: '获取任务列表' })
  @ApiResult({ type: [Task], isPage: true })
  async findAll(@GetToken() token: TokenInfo, @Query() query: QueryTaskDto) {
    return await this.taskService.findAll(token.id, query);
  }

  @Get('mine/list')
  @ApiOperation({ summary: '获取我的任务列表' })
  @ApiResult({ type: [Task], isPage: true })
  async findMineList(
    @GetToken() token: TokenInfo,
    @Query() query: QueryMineTaskDto,
  ) {
    return await this.userTaskService.getUserTasks(token.id, query);
  }

  @Public()
  @Get('info/:id')
  @ApiOperation({ summary: '获取任务详情' })
  @ApiResult({ type: Task })
  async findOne(@Param('id') id: string) {
    return await this.taskService.findOne(id);
  }

  @ApiOperation({ summary: '申请任务: 保持一定时间' })
  @ApiResult({ type: Boolean })
  @Post('apply/:id')
  async applyForTask(
    @Param('id') id: string,
    @GetToken() token: TokenInfo,
    @Body() body: ApplyTaskDto,
  ) {
    const task = await this.taskService.findOne(id);
    if (!task) throw new NotFoundException('任务不存在');

    if (!!body.taskMaterialId) {
      const taskMaterial = await this.taskService.getTaskMaterialById(
        body.taskMaterialId,
      );
      if (!taskMaterial) throw new NotFoundException('任务素材不存在');
    }

    const res = await this.userTaskService.userApplyTask(token.id, task, body);

    if (!!body.taskMaterialId)
      this.taskService.upTaskMaterialUsedCount(body.taskMaterialId);

    return res;
  }

  @ApiOperation({ summary: '提交任务 id是用户任务ID' })
  @ApiResult({ type: Boolean })
  @Post('submit/:id')
  async submitTask(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body() data: SubmitTaskDto,
  ) {
    const userTask = await this.userTaskService.getUserTaskInfoById(id);
    if (!userTask || userTask.userId.toString() !== token.id)
      throw new AppHttpException(ErrHttpBack.user_task_no_had);

    const res = await this.userTaskService.submitTask(userTask, data);

    if (res.status === UserTaskStatus.PENDING) {
      this.bullTaskAuditQueue.add(
        'start',
        {
          userTaskId: id,
        },
        {
          attempts: 5, // 这个作业特定的重试次数
          backoff: {
            type: 'fixed', // 固定间隔重试
            delay: 1000 * 30, // 每次重试间隔5秒
          },
        },
      );
    }

    return res;
  }

  // 任务提现（创建提现数据）
  @ApiOperation({ summary: '用户任务提现' })
  @ApiResult({ type: Boolean })
  @Post('withdraw/:id')
  async withdrawCashUserTask(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body() data: { accountId: string },
  ) {
    const userTask = await this.userTaskService.getUserTaskInfoById(id);
    if (!userTask || userTask.userId.toString() !== token.id)
      throw new NotFoundException('任务不存在');
    if (userTask.status !== UserTaskStatus.APPROVED)
      throw new NotFoundException('任务状态不正确');
    const account = await this.financeService.getUserWalletAccountById(
      data.accountId,
    );
    if (!account) throw new NotFoundException('钱包账户不存在');

    return await this.financeService.createUserWalletRecord(token.id, account, {
      dataId: userTask.id,
      type: UserWalletRecordType.WITHDRAW,
      balance: userTask.reward, // 将 number 转换为 Decimal128
      des: '任务提现',
      status: UserWalletRecordStatus.WAIT,
    });
  }

  @ApiOperation({ summary: '统计合计进行中的任务的金额总数' })
  @Get('reward/amount')
  @ApiResult({ type: Number })
  async getTotalAmountOfDoingTasks(@GetToken() token: TokenInfo) {
    return await this.taskService.getTotalAmountOfDoingTasks(token.id);
  }

  @ApiOperation({ summary: '获取任务的最优素材' })
  @Get('material/frist/:id')
  @ApiResult({ type: TaskMaterial })
  async getFristTaskMaterial(@Param('id') id: string) {
    return await this.taskService.getFristTaskMaterial(id);
  }
}

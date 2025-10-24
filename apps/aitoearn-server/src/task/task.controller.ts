import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TableDto } from '@yikart/common'
import { GetToken } from '../auth/auth.guard'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { AcceptTaskDto, SubmitTaskDto } from './task.dto'
import { TaskService } from './task.service'
import { TaskWithOpportunityVo, TotalAmountVo, UserTaskVo } from './task.vo'

@ApiTags('task - 任务')
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiOperation({ summary: '获取待接取的任务列表' })
  @Get('opportunity/list/:pageNo/:pageSize')
  async getTaskOpportunityList(@GetToken() token: TokenInfo, @Param() params: TableDto) {
    const result = await this.taskService.getTaskOpportunityList(params, token.id)
    return result
  }

  @ApiOperation({ summary: '获取任务信息' })
  @Get('opportunity/info/:opportunityId')
  async getTaskInfo(@Param('opportunityId') opportunityId: string): Promise<TaskWithOpportunityVo> {
    const result = await this.taskService.getTaskInfoByOpportunityId(opportunityId)
    return result
  }

  @ApiOperation({ summary: '设置任务已读' })
  @Put('opportunity/doView/:opportunityId')
  async doView(
    @GetToken() token: TokenInfo,
    @Param('opportunityId') opportunityId: string,
  ) {
    const result = await this.taskService.doView(token.id, opportunityId)
    return result
  }

  @ApiOperation({ summary: '设置全部任务已读' })
  @Put('opportunity/doViewAll')
  async doViewAll(
    @GetToken() token: TokenInfo,
  ) {
    const result = await this.taskService.doViewAll(token.id)
    return result
  }

  @ApiOperation({ summary: '获取未读数量总数' })
  @Put('opportunity/getNotViewCount')
  async getNotViewCount(
    @GetToken() token: TokenInfo,
  ) {
    const result = await this.taskService.getNotViewCount(token.id)
    return result
  }

  @ApiOperation({ summary: '获取进行中任务的金额总数' })
  @Get('reward-amount')
  async getTotalRewardAmount(
    @GetToken() token: TokenInfo,
  ): Promise<TotalAmountVo> {
    const result = await this.taskService.getTotalRewardAmount(token.id)
    return TotalAmountVo.create(result)
  }

  @ApiOperation({ summary: '用户接取任务' })
  @Post('accept')
  async acceptTask(
    @GetToken() token: TokenInfo,
    @Body() body: AcceptTaskDto,
  ): Promise<UserTaskVo> {
    const result = await this.taskService.acceptTask(token.id, body.opportunityId, body.accountId)
    return result
  }

  @ApiOperation({ summary: '用户提交完成任务' })
  @Post('submit')
  async submitTask(
    @GetToken() token: TokenInfo,
    @Body() body: SubmitTaskDto,
  ) {
    const result = await this.taskService.submitTask(token.id, body.userTaskId, body.materialId)
    return result
  }
}

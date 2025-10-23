import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AppException, TableDto } from '@yikart/common'
import { GetToken } from '../../../common/auth/auth.guard'
import { TokenInfo } from '../../../common/auth/interfaces/auth.interfaces'
import { ChannelApi } from '../../../transports/channel/channel.api'
import { TaskService } from '../task.service'
import { RejectedTaskDto, UserTaskApprovedDto, UserTaskListQueryDto } from './user-task.dto'
import { UserTaskService } from './user-task.service'

@ApiTags('用户任务管理')
@Controller('task/userTask')
export class UserTaskController {
  constructor(
    private readonly userTaskService: UserTaskService,
    private readonly taskService: TaskService,
    private readonly channelApi: ChannelApi,
  ) {}

  @ApiOperation({ summary: '获取用户任务列表' })
  @Get('list/:pageNo/:pageSize')
  async getList(@Param() params: TableDto, @Query() query: UserTaskListQueryDto) {
    const result = await this.userTaskService.getList(params, query)
    return result
  }

  @ApiOperation({ summary: '获取用户任务详情' })
  @Get('info/:id')
  async getById(@Param('id') id: string) {
    const userTask = await this.userTaskService.getById(id)
    if (!userTask) {
      throw new AppException(11233, '用户任务不存在')
    }
    const task = await this.taskService.getById(userTask.taskId)

    // 获取该任务的发放记录
    const userTaskRecord = await this.channelApi.getPublishRecardByUserTaskId(id)
    return { userTask, task, userTaskRecord }
  }

  @ApiOperation({ summary: '任务通过并发放奖励' })
  @Post('verify/approved')
  async verifyUserTaskApproved(
    @GetToken() tokenInfo: TokenInfo,
    @Body() body: UserTaskApprovedDto,
  ) {
    const result = await this.userTaskService.verifyApproved(body.id, tokenInfo.id, body.screenshotUrls)
    return result
  }

  @ApiOperation({ summary: '任务拒绝' })
  @Post('verify/rejected')
  async verifyUserTaskRejected(
    @GetToken() tokenInfo: TokenInfo,
    @Body() body: RejectedTaskDto,
  ) {
    const userTask = await this.userTaskService.verifyRejected({
      verifierUserId: tokenInfo.id,
      ...body,
    })
    return userTask
  }

  @ApiOperation({ summary: '回退任务' })
  @Post('rollback')
  async rollbackUserTaskApproved(
    @GetToken() tokenInfo: TokenInfo,
    @Body() body: RejectedTaskDto,
  ) {
    const userTask = await this.userTaskService.rollbackApproved({
      verifierUserId: tokenInfo.id,
      ...body,
    })
    return userTask
  }
}

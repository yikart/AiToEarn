import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation } from '@nestjs/swagger'
import { UserIdDto } from '../task/task.dto'
import {
  UserTaskAcceptDto,
  UserTaskDetailDto,
  UserTaskQueryDto,
  UserTaskSubmitDto,
} from './userTask.dto'
import { UserTaskService } from './userTask.service'

@Controller()
export class UserTaskController {
  constructor(
    private readonly userTaskService: UserTaskService,
  ) {}

  /**
   * 用户接受任务
   */
  // @NatsMessagePattern('task.userTask.accept')
  @Post('task/userTask/accept')
  async acceptTask(@Body() data: UserTaskAcceptDto) {
    const res = await this.userTaskService.acceptTask(data.userId, data.opportunityId, data.accountId)
    return res
  }

  // @NatsMessagePattern('task.userTask.submit')
  @Post('task/userTask/submit')
  async submitUserTask(@Body() data: UserTaskSubmitDto) {
    const task = await this.userTaskService.submitTask(data)
    return task
  }

  // @NatsMessagePattern('task.userTask.list')
  @Post('task/userTask/list')
  async getUserTasks(@Body() data: UserTaskQueryDto) {
    const tasks = await this.userTaskService.findUserTasks(data.page, data.filter)
    return tasks
  }

  // @NatsMessagePattern('task.userTask.info')
  @Post('task/userTask/info')
  async getUserTask(@Body() data: { id: string }) {
    const task = await this.userTaskService.getUserTaskInfoById(data.id)
    return task
  }

  // @NatsMessagePattern('task.userTask.detail')
  @Post('task/userTask/detail')
  async getUserTaskDetail(@Body() data: UserTaskDetailDto) {
    const task = await this.userTaskService.getUserTaskDetail(data.userId, data.id)
    return task
  }

  @ApiOperation({ summary: '统计合计进行中的任务的金额总数' })
  // @NatsMessagePattern('task.task.rewardAmount')
  @Post('task/task/rewardAmount')
  async getTotalAmountOfDoingTasks(@Body() data: UserIdDto) {
    const totalAmount = await this.userTaskService.getTotalAmountOfDoingTasks(data.userId)
    return { totalAmount }
  }
}

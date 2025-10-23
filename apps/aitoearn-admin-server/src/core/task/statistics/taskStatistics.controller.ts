import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { TaskPostPeriodDto, TaskPostsDto } from './taskStatistics.dto'
import { TaskStatisticsService } from './taskStatistics.service'

@ApiTags('任务数据')
@Controller('task/statistics')
export class TaskStatisticsController {
  constructor(
    private readonly taskStatisticsService: TaskStatisticsService,
  ) {}

  @ApiOperation({ summary: '根据任务ID获取任务作品数据' })
  @Post('task/posts/dataCube')
  async getTaskPostsDataCube(
    @Body() body: TaskPostsDto,
  ) {
    return await this.taskStatisticsService.getTaskPostsStatistics(body.taskId)
  }

  @ApiOperation({ summary: '根据作品ID获取任务作品数据' })
  @Post('task/posts/periodDetail')
  async getTaskPostsPeriodDetail(
    @Body() body: TaskPostPeriodDto,
  ) {
    return await this.taskStatisticsService.getTaskPostStatisticsDetail(body.platform, body.postId)
  }
}

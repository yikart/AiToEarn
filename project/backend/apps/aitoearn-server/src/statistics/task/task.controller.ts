import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
import { PostService } from '../post/post.service'
import { postDetailDto, taskIdDto, taskPostDto } from './dto/task.dto'
import { TaskService } from './task.service'

@ApiTags('OpenSource/Statistics/Task')
@Controller('statistics/task')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly postService: PostService,
  ) {}

  /**
   * 用户任务提交作品记录
   * @param data
   * @returns
   */
  // @NatsMessagePattern('statistics.task.posts.record')
  @ApiDoc({
    summary: 'Record Task Post Submission',
    body: taskPostDto.schema,
  })
  @Post('posts/record')
  async getAccounts(@Body() data: taskPostDto) {
    return this.taskService.userTaskPosts(data)
  }

  /**
   * 根据任务ID 获取作品数据 并汇总
   * @param data
   * @returns
   */
  // @NatsMessagePattern('statistics.task.posts.dataCube')
  @ApiDoc({
    summary: 'Get Task Post Summary',
    body: taskIdDto.schema,
  })
  @Post('posts/dataCube')
  async getPostsStatistics(@Body() data: taskIdDto) {
    return await this.taskService.getTaskPostsSummary(data.taskId)
  }

  /**
   * 根据作品ID 按日期时间段 获取作品数据数组
   * @param data
   * @returns
   */
  // @NatsMessagePattern('statistics.task.posts.periodDetail')
  @ApiDoc({
    summary: 'Get Post Details by Date Range',
    body: postDetailDto.schema,
  })
  @Post('posts/periodDetail')
  async getPostsStatisticsDetail(@Body() data: postDetailDto) {
    return await this.postService.getPostDataByDateRange({ platform: data.platform, postId: data.postId, page: 1, pageSize: 90 })
  }
}

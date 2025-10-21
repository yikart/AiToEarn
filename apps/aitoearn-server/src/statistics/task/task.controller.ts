import { Body, Controller, Post } from '@nestjs/common'
import { PostService } from '../post/post.service'
import { postDetailDto, taskIdDto, taskPostDto } from './dto/task.dto'
import { TaskService } from './task.service'

@Controller()
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

  @Post('statistics/task/posts/record')
  async getAccounts(@Body() data: taskPostDto) {
    return this.taskService.userTaskPosts(data.accountId, data.type, data.uid, data.taskId, data.postId)
  }

  /**
   * 根据任务ID 获取作品数据 并汇总
   * @param data
   * @returns
   */
  // @NatsMessagePattern('statistics.task.posts.dataCube')
  @Post('statistics/task/posts/dataCube')
  async getPostsStatistics(@Body() data: taskIdDto) {
    return await this.taskService.getTaskPostsSummary(data.taskId)
  }

  /**
   * 根据作品ID 按日期时间段 获取作品数据数组
   * @param data
   * @returns
   */
  // @NatsMessagePattern('statistics.task.posts.periodDetail')
  @Post('statistics/task/posts/periodDetail')
  async getPostsStatisticsDetail(@Body() data: postDetailDto) {
    return await this.postService.getPostDataByDateRange({ platform: data.platform, postId: data.postId, page: 1, pageSize: 90 })
  }
}

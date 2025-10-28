import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { FetchAllPostsRequestDto, FetchPostRequestDto, FetchPostsRequestDto } from './post.dto'
import { PostService } from './post.service'

@ApiTags('社交媒体作品')
@Controller()
export class PostController {
  constructor(
    private readonly postService: PostService,
  ) {}

  // 测试路由
  @Public()
  @Post('test')
  async test() {
    return { message: 'PostController is working!' }
  }

  // @NatsMessagePattern('statistics.channel.posts')
  @Post('statistics/posts/list')
  async fetchChannelPosts(@Body() payload: FetchPostsRequestDto) {
    return await this.postService.getPostsByPlatform(payload)
  }

  // @Post()
  // async FetchChannelPostsByHttp(@Body() payload: FetchPostsRequestDto) {
  //   return await this.postService.getPostsByPlatform(payload)
  // }

  // @NatsMessagePattern('statistics.post.detail')
  @Post('statistics/posts/detail')
  async fetchOnePostDetail(@Body() payload: FetchPostRequestDto) {
    return await this.postService.getPostsByPid(payload)
  }

  // @NatsMessagePattern('statistics.channel.posts.withoutPagination')
  @Post('statistics/posts/withoutPagination')
  async fetchChannelAllPosts(@Body() payload: FetchAllPostsRequestDto) {
    return await this.postService.getUserAllPostsByPlatform(payload)
  }

  /**
   * 各数据字段计算平均数据，日期可选
   * @param payload
   * @returns
   */
  // @NatsMessagePattern('statistics.channel.posts.average')
  @Post('statistics/posts/average')
  async userAverageSummaryMonthly(@Body() payload: FetchAllPostsRequestDto) {
    return this.postService.getAverageSummaryMonthly(payload)
  }
}

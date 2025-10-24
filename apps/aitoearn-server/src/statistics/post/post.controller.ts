import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, Public } from '../../auth/auth.guard'
import { FetchAllPostsRequestDto, FetchPostRequestDto, FetchPostsRequestDto } from './post.dto'
import { PostService } from './post.service'

@ApiTags('社交媒体作品')
@Controller()
export class PostController {
  constructor(
    private readonly postService: PostService,
  ) {}

  // @NatsMessagePattern('statistics.channel.posts')
  @Post('statistics/channel/posts')
  async fetchChannelPosts(@Body() payload: FetchPostsRequestDto) {
    return await this.postService.getPostsByPlatform(payload)
  }

  @Post()
  async FetchChannelPostsByHttp(@Body() payload: FetchPostsRequestDto) {
    return await this.postService.getPostsByPlatform(payload)
  }

  // @NatsMessagePattern('statistics.post.detail')
  @Post('statistics/post/detail')
  async fetchOnePostDetail(@Body() payload: FetchPostRequestDto) {
    return await this.postService.getPostsByPid(payload)
  }

  // @NatsMessagePattern('statistics.channel.posts.withoutPagination')
  @Post('statistics/channel/posts/withoutPagination')
  async fetchChannelAllPosts(@Body() payload: FetchAllPostsRequestDto) {
    return await this.postService.getUserAllPostsByPlatform(payload)
  }

  /**
   * 各数据字段计算平均数据，日期可选
   * @param payload
   * @returns
   */
  // @NatsMessagePattern('statistics.channel.posts.average')
  @Post('statistics/channel/posts/average')
  async userAverageSummaryMonthly(@Body() payload: FetchAllPostsRequestDto) {
    return this.postService.getAverageSummaryMonthly(payload)
  }
}

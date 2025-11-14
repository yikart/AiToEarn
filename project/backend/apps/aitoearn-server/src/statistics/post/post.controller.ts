import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { FetchAllPostsRequestDto, FetchPostRequestDto, FetchPostsRequestDto } from './post.dto'
import { PostService } from './post.service'

@ApiTags('OpenSource/Home/Statistics/Post')
@Controller('statistics/posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
  ) {}

  // 测试路由
  @ApiDoc({
    summary: 'Test Posts Endpoint',
    description: 'Health check endpoint for post statistics.',
  })
  @Public()
  @Post('test')
  async test() {
    return { message: 'PostController is working!' }
  }

  @ApiDoc({
    summary: 'List Channel Posts',
    body: FetchPostsRequestDto.schema,
  })
  @Post('list')
  async fetchChannelPosts(@Body() payload: FetchPostsRequestDto) {
    return await this.postService.getPostsByPlatform(payload)
  }

  @ApiDoc({
    summary: 'Get Post Detail',
    body: FetchPostRequestDto.schema,
  })
  @Post('detail')
  async fetchOnePostDetail(@Body() payload: FetchPostRequestDto) {
    return await this.postService.getPostsByPid(payload)
  }

  @ApiDoc({
    summary: 'List Channel Posts Without Pagination',
    body: FetchAllPostsRequestDto.schema,
  })
  @Post('withoutPagination')
  async fetchChannelAllPosts(@Body() payload: FetchAllPostsRequestDto) {
    return await this.postService.getUserAllPostsByPlatform(payload)
  }

  /**
   * 各数据字段计算平均数据，日期可选
   * @param payload
   * @returns
   */
  @ApiDoc({
    summary: 'Calculate Average Post Metrics',
    description: 'Calculate average metrics for posts within an optional date range.',
    body: FetchAllPostsRequestDto.schema,
  })
  @Post('average')
  async userAverageSummaryMonthly(@Body() payload: FetchAllPostsRequestDto) {
    return this.postService.getAverageSummaryMonthly(payload)
  }
}

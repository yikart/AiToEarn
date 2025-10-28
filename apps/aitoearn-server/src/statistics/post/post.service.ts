import { Injectable, Logger } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { PostRepository } from '@yikart/statistics-db'
import { FetchAllPostsRequestDto, FetchPostRequestDto, FetchPostsBatchRequestDto, FetchPostsRequestDto } from './post.dto'

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name)
  constructor(
    private readonly postRepository: PostRepository,
  ) {
  }

  // 根据平台platform和uid 获取作品
  async getPostsByPlatform(
    @Payload() payload: FetchPostsRequestDto,
  ) {
    return await this.postRepository.getPostsByPlatform(payload)
  }

  // 根据平台platform和作品id数组postIds 获取作品
  async getPostsByPids(
    @Payload() payload: FetchPostsBatchRequestDto,
  ) {
    return await this.postRepository.getPostsByPids(payload)
  }

  // 根据平台platform和作品postId 获取单个作品数据
  async getPostsByPid(
    @Payload() payload: FetchPostRequestDto,
  ) {
    return await this.postRepository.getPostsByPid(payload)
  }

  /**
   * 根据平台、postId 与时间范围查询帖子数据
   * - startDate 为空时，默认取 endDate 往前 90 天
   * - endDate 为空时，默认取今天
   * - 时间字段使用 publishTime（number 时间戳）
   */
  async getPostDataByDateRange(payload: {
    platform: string
    postId: string
    startDate?: string | number | Date
    endDate?: string | number | Date
    page?: number
    pageSize?: number
  }) {
    return await this.postRepository.getPostDataByDateRange(payload)
  }

  async getUserAllPosts(
    @Payload() payload: FetchAllPostsRequestDto,
  ) {
    return await this.postRepository.getUserAllPosts(payload)
  }

  async getUserAllPostsByPlatform(
    @Payload() payload: FetchAllPostsRequestDto,
  ) {
    return await this.postRepository.getUserAllPostsByPlatform(payload)
  }

  /**
   * 计算查询到的作品列表中核心指标的平均值
   * - 输入范围由 payload 决定（如有传入 range 则按范围过滤）
   * - 平均字段：viewCount、commentCount、likeCount、shareCount
   * - 当无数据时，平均值返回 0
   */
  async getAverageSummaryMonthly(payload: FetchAllPostsRequestDto) {
    return await this.postRepository.getAverageSummaryMonthly(payload)
  }
}

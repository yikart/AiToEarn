import { Injectable, Logger } from '@nestjs/common'
import { PublishedPostRepository } from '@yikart/mongodb'
import { FetchAllPostsRequestDto } from './post.dto'

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name)
  constructor(
    private readonly postRepository: PublishedPostRepository,
  ) {
  }

  async getUserAllPosts(
    payload: FetchAllPostsRequestDto,
  ) {
    return await this.postRepository.list(payload)
  }

  async getUserAllPostsByPlatform(
    payload: FetchAllPostsRequestDto,
  ) {
    return await this.postRepository.list(payload)
  }
}

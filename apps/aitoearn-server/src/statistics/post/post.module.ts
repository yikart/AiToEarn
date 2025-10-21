import { Module } from '@nestjs/common'
import { PostController } from './post.controller'
import { PostService } from './post.service'

@Module({
  imports: [],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}

import { Module } from '@nestjs/common'
import { PostService } from './post.service'

@Module({
  imports: [],
  controllers: [],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}

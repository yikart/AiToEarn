import { Module } from '@nestjs/common'
import { PostModule } from '../../statistics/post/post.module'
import { PostService } from '../../statistics/post/post.service'
import { EngagementController } from './engagement.controller'
import { EngagementService } from './engagement.service'

@Module({
  imports: [PostModule],
  controllers: [EngagementController],
  providers: [EngagementService, PostService],
  exports: [EngagementService],
})

export class EngagementModule { }

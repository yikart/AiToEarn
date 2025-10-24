import { Module } from '@nestjs/common'
import { PostModule } from '../post/post.module'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'

@Module({
  imports: [PostModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule { }

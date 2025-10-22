import { Module } from '@nestjs/common'
import { TaskMatcherController } from './task-matcher.controller'
import { TaskMatcherService } from './task-matcher.service'

@Module({
  imports: [],
  controllers: [TaskMatcherController],
  providers: [TaskMatcherService],
  exports: [TaskMatcherService],
})
export class TaskMatcherModule { }

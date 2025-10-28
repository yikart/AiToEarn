import { Module } from '@nestjs/common'
import { MaterialModule } from './material/material.module'
import { TaskPortraitService } from './portrait/portrait.service'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'
import { UserTaskModule } from './user-task/user-task.module'

@Module({
  imports: [MaterialModule, UserTaskModule],
  controllers: [TaskController],
  providers: [TaskService, TaskPortraitService],
  exports: [TaskService, TaskPortraitService],
})
export class TaskModule {}

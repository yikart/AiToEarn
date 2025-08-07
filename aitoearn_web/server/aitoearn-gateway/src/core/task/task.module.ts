import { Module } from '@nestjs/common'
import { MaterialModule } from './material/material.module'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'
import { UserTaskModule } from './user-task/user-task.module'

@Module({
  imports: [MaterialModule, UserTaskModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}

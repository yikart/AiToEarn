import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { TaskApiModule } from './api/taskApi.module'
import { UserTaskNatsApi } from './api/user-task.natsApi'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'
import { UserTaskService } from './userTask.service'

@Global()
@Module({
  imports: [HttpModule, TaskApiModule],
  providers: [TaskService, UserTaskService, UserTaskNatsApi],
  controllers: [TaskController],
  exports: [TaskService, UserTaskService],
})
export class TaskModule {}

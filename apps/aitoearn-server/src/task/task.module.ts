import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'
import { UserTaskService } from './userTask.service'

@Global()
@Module({
  imports: [HttpModule],
  providers: [TaskService, UserTaskService],
  controllers: [TaskController],
  exports: [TaskService, UserTaskService],
})
export class TaskModule {}

import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { TaskNatsApi } from './api/task.natsApi'
import { UserTaskNatsApi } from './api/user-task.natsApi'

@Global()
@Module({
  imports: [HttpModule],
  providers: [UserTaskNatsApi, TaskNatsApi],
  exports: [UserTaskNatsApi, TaskNatsApi],
})
export class TaskApiModule { }

import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { TaskPortraitNatsApi } from './api/portrait.natsApi'
import { TaskNatsApi } from './api/task.natsApi'
import { UserTaskNatsApi } from './api/user-task.natsApi'

@Global()
@Module({
  imports: [HttpModule],
  providers: [UserTaskNatsApi, TaskNatsApi, TaskPortraitNatsApi],
  exports: [UserTaskNatsApi, TaskNatsApi, TaskPortraitNatsApi],
})
export class TaskApiModule { }

import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { TaskPortraitNatsApi } from './portrait.natsApi'
import { TaskNatsApi } from './task.natsApi'
import { UserTaskNatsApi } from './user-task.natsApi'

@Global()
@Module({
  imports: [HttpModule],
  providers: [UserTaskNatsApi, TaskNatsApi, TaskPortraitNatsApi],
  exports: [UserTaskNatsApi, TaskNatsApi, TaskPortraitNatsApi],
})
export class TaskApiModule {}

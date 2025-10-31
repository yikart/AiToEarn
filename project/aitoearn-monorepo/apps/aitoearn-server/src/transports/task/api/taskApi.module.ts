import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { TaskNatsApi } from './task.natsApi'
import { UserTaskNatsApi } from './user-task.natsApi'

@Global()
@Module({
  imports: [HttpModule],
  providers: [UserTaskNatsApi, TaskNatsApi],
  exports: [UserTaskNatsApi, TaskNatsApi],
})
export class TaskApiModule {}

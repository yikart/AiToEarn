import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { TaskMaterialNatsApi } from './material.natsApi'
import { TaskPortraitNatsApi } from './portrait.natsApi'
import { TaskNatsApi } from './task.natsApi'
import { UserTaskNatsApi } from './user-task.natsApi'

@Global()
@Module({
  imports: [HttpModule],
  providers: [UserTaskNatsApi, TaskNatsApi, TaskPortraitNatsApi, TaskMaterialNatsApi],
  exports: [UserTaskNatsApi, TaskNatsApi, TaskPortraitNatsApi, TaskMaterialNatsApi],
})
export class TaskApiModule {}

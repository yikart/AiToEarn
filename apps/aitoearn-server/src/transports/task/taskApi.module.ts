import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { TaskMaterialNatsApi } from './api/material.natsApi'
import { TaskPortraitNatsApi } from './api/portrait.natsApi'
import { TaskNatsApi } from './api/task.natsApi'
import { UserTaskNatsApi } from './api/user-task.natsApi'

@Global()
@Module({
  imports: [HttpModule],
  providers: [UserTaskNatsApi, TaskNatsApi, TaskPortraitNatsApi, TaskMaterialNatsApi],
  exports: [UserTaskNatsApi, TaskNatsApi, TaskPortraitNatsApi, TaskMaterialNatsApi],
})
export class TaskApiModule { }

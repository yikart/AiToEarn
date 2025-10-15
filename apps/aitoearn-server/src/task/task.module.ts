import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'

@Global()
@Module({
  imports: [HttpModule],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {}

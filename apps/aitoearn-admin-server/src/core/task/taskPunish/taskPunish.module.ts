import { Module } from '@nestjs/common'
import { TaskPunishController } from './taskPunish.controller'
import { TaskPunishService } from './taskPunish.service'

@Module({
  imports: [],
  controllers: [TaskPunishController],
  providers: [TaskPunishService],
  exports: [TaskPunishService],
})
export class TaskPunishModule {}

import { Module } from '@nestjs/common'
import { UserTaskModule } from '../user-task'
import { TaskPunishController } from './taskPunish.controller'
import { TaskPunishService } from './taskPunish.service'

@Module({
  imports: [
    UserTaskModule,
  ],
  controllers: [TaskPunishController],
  providers: [TaskPunishService],
  exports: [TaskPunishService],
})
export class TaskPunishModule {}

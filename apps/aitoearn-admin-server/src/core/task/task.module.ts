import { Module } from '@nestjs/common'
import { NotificationController } from './notification/notification.controller'
import { NotificationService } from './notification/notification.service'
import { AccountPortraitController } from './portrait/accountPortrait.controller'
import { AccountPortraitService } from './portrait/accountPortrait.service'
import { UserPortraitController } from './portrait/userPortrait.controller'
import { UserPortraitService } from './portrait/userPortrait.service'
import { RuleModule } from './rule/rule.module'
import { TaskStatisticsController } from './statistics/taskStatistics.controller'
import { TaskStatisticsService } from './statistics/taskStatistics.service'
import { TaskMatcherModule } from './task-matcher/task-matcher.module'
import { TaskController } from './task.controller'
import { TaskService } from './task.service'
import { TaskPunishModule } from './taskPunish/taskPunish.module'
import { UserTaskController } from './user-task/user-task.controller'
import { UserTaskService } from './user-task/user-task.service'

@Module({
  imports: [RuleModule, TaskMatcherModule, TaskPunishModule],
  controllers: [
    NotificationController,
    UserTaskController,
    TaskController,
    AccountPortraitController,
    UserPortraitController,
    TaskStatisticsController,
  ],
  providers: [
    TaskService,
    UserTaskService,
    NotificationService,
    AccountPortraitService,
    UserPortraitService,
    TaskStatisticsService,
  ],
})
export class TaskModule {}

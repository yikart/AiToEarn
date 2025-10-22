import { Module } from '@nestjs/common'
import { AccountPortraitModule } from './account-portrait/account-portrait.module'
import { RuleModule } from './rule/rule.module'
import { TaskMatcherModule } from './task-matcher/task-matcher.module'
import { TaskModule } from './task/task.module'
import { TaskPunishModule } from './taskPunish/taskPunish.module'
import { UserPortraitModule } from './user-portrait/user-portrait.module'
import { UserTaskModule } from './user-task/userTask.module'

@Module({
  imports: [
    TaskModule,
    RuleModule,
    TaskMatcherModule,
    UserTaskModule,
    UserPortraitModule,
    AccountPortraitModule,
    TaskPunishModule,
  ],
  providers: [],
})
export class CoreModule { }

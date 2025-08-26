import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { AppConfigsController } from './appConfigs.controller'
import { AppConfigsService } from './appConfigs.service'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'
import { GologinController } from './gologin.controller'
import { GologinService } from './gologin.service'

@Module({
  imports: [UserModule],
  providers: [FeedbackService, GologinService, AppConfigsService],
  controllers: [FeedbackController, GologinController, AppConfigsController],
})
export class OtherModule {}

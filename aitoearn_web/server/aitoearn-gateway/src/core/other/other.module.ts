import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { FeedbackController } from './feedback.controller'
import { FeedbackService } from './feedback.service'
import { GologinController } from './gologin.controller'
import { GologinService } from './gologin.service'

@Module({
  imports: [UserModule],
  providers: [FeedbackService, GologinService],
  controllers: [FeedbackController, GologinController],
})
export class OtherModule {}

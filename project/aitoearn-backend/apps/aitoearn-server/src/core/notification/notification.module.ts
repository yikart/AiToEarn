import { Global, Module } from '@nestjs/common'
import { EmailService } from './email.service'
import { NotificationConsumer } from './notification.consumer'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'

@Global()
@Module({
  imports: [],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationConsumer, EmailService],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}

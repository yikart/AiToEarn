import { Module } from '@nestjs/common'
import { NotificationNatsApi } from '@transports/notification/notification.natsApi'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationNatsApi],
  exports: [NotificationService],
})
export class NotificationModule {}

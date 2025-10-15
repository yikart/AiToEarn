import { Module } from '@nestjs/common'
import { OneSignalModule } from '@yikart/one-signal'
import { config } from '../../config'
import { NotificationController } from './notification.controller'
import { NotificationService } from './notification.service'

@Module({
  imports: [
    OneSignalModule.register(config.oneSignal),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

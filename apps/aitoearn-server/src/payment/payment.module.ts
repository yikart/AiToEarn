import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { CloudSpaceModule } from '../cloud/core/cloud-space'
import { PaymentNatsApi } from './api/payment.natsApi'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'

@Global()
@Module({
  imports: [
    HttpModule,
    CloudSpaceModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentNatsApi],
  exports: [PaymentService],
})
export class PaymentModule { }

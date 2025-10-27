import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'
import { CloudSpaceModule } from '../cloud/core/cloud-space'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'

@Global()
@Module({
  imports: [
    HttpModule,
    CloudSpaceModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule { }

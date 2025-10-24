import { Module } from '@nestjs/common'
import { AliGreenApiModule } from '../../libs/ali-green/ali-green-api.module'
import { AliGreenController } from './ali-green.controller'
import { AliGreenService } from './ali-green.service'

@Module({
  imports: [
    AliGreenApiModule,
  ],
  controllers: [AliGreenController],
  providers: [AliGreenService],
  exports: [AliGreenService],
})
export class AliGreenModule {}

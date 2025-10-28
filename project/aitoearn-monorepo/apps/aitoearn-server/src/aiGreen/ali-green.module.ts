import { Module } from '@nestjs/common'
import { AliGreenApiModule } from '@yikart/ali-green'
import { config } from '../config'
import { AliGreenController } from './ali-green.controller'
import { AliGreenService } from './ali-green.service'

@Module({
  imports: [AliGreenApiModule.forRoot(config.aliGreen)],
  controllers: [AliGreenController],
  providers: [AliGreenService],
})
export class AliGreenModule {}

import { Module } from '@nestjs/common'
import { MaterialController } from './material.controller'
import { MaterialService } from './material.service'

@Module({
  controllers: [MaterialController],
  providers: [MaterialService],
  exports: [MaterialService],
})
export class MaterialModule {}

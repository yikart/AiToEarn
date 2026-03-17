import { Module } from '@nestjs/common'
import { HelpersModule } from '@yikart/helpers'
import { MaterialAdaptationController } from './material-adaptation.controller'
import { MaterialAdaptationService } from './material-adaptation.service'

@Module({
  imports: [HelpersModule],
  controllers: [MaterialAdaptationController],
  providers: [MaterialAdaptationService],
  exports: [MaterialAdaptationService],
})
export class MaterialAdaptationModule {}

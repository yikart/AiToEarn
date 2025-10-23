import { Module } from '@nestjs/common'
import { CloudSpacesController } from './cloud-spaces.controller'
import { CloudSpacesService } from './cloud-spaces.service'

@Module({
  controllers: [CloudSpacesController],
  providers: [CloudSpacesService],
  exports: [CloudSpacesService],
})
export class CloudSpacesModule {}

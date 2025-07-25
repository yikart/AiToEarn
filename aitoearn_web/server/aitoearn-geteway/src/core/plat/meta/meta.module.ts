import { Module } from '@nestjs/common'
import { MetaController } from './meta.controller'
import { MetaService } from './meta.service'

@Module({
  imports: [],
  controllers: [MetaController],
  providers: [MetaService],
  exports: [MetaService],
})
export class MetaModule {}

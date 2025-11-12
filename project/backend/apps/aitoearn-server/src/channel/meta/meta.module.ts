import { Module } from '@nestjs/common'
import { MetaController } from './meta.controller'

@Module({
  imports: [],
  controllers: [MetaController],
  providers: [],
  exports: [],
})
export class MetaModule {}

import { Module } from '@nestjs/common'
import { KwaiController } from './kwai.controller'

@Module({
  imports: [],
  controllers: [KwaiController],
  providers: [],
  exports: [],
})
export class KwaiModule {}

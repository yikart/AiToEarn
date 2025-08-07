import { Module } from '@nestjs/common'
import { KwaiController } from './kwai.controller'
import { KwaiService } from './kwai.service'

@Module({
  imports: [],
  controllers: [KwaiController],
  providers: [KwaiService],
  exports: [KwaiService],
})
export class KwaiModule {}

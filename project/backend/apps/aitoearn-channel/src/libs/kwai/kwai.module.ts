import { Module } from '@nestjs/common'
import { KwaiApiService } from './kwai.service'

@Module({
  imports: [],
  providers: [KwaiApiService],
  exports: [KwaiApiService],
})
export class KwaiApiModule {}

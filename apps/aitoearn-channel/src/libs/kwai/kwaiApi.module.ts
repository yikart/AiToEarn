import { Module } from '@nestjs/common'
import { KwaiApiService } from './kwaiApi.service'

@Module({
  imports: [],
  providers: [KwaiApiService],
  exports: [KwaiApiService],
})
export class KwaiApiModule {}

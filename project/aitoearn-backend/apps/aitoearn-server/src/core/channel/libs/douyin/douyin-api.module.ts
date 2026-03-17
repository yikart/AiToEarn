import { Module } from '@nestjs/common'
import { DouyinApiService } from './douyin-api.service'

@Module({
  imports: [],
  providers: [DouyinApiService],
  exports: [DouyinApiService],
})
export class DouyinApiModule {}

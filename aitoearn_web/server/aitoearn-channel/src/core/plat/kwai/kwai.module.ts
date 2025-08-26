import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { KwaiApiModule } from '@/libs/kwai/kwaiApi.module'
import { KwaiController } from './kwai.controller'
import { KwaiService } from './kwai.service'

@Module({
  imports: [ConfigModule, KwaiApiModule],
  controllers: [KwaiController],
  providers: [KwaiService],
  exports: [KwaiService],
})
export class KwaiModule {}

import { Module } from '@nestjs/common'
import { PinterestApiModule } from '@/libs/pinterest/pinterestApi.module'
import { PinterestController } from './pinterest.controller'
import { PinterestService } from './pinterest.service'

@Module({
  imports: [
    PinterestApiModule,
  ],
  controllers: [PinterestController],
  providers: [PinterestService],
})
export class PinterestModule {}

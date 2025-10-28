import { Module } from '@nestjs/common'
import { PinterestController } from './pinterest.controller'
import { PinterestService } from './pinterest.service'

@Module({
  imports: [],
  controllers: [PinterestController],
  providers: [PinterestService],
})
export class PinterestModule {}

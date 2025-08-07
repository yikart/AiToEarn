import { Module } from '@nestjs/common'
import { SkKeyController } from './skKey.controller'

@Module({
  imports: [],
  controllers: [SkKeyController],
})
export class SkKeyModule {}

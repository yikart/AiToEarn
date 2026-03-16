import { Module } from '@nestjs/common'
import { AssetsController } from './assets.controller'

@Module({
  controllers: [AssetsController],
})
export class AssetsModule {}

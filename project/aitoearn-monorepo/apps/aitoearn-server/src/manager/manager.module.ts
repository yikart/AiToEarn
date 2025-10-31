import { Module } from '@nestjs/common'
import { ManagerController } from './manager.controller'
import { ManagerService } from './manager.service'

@Module({
  imports: [],
  controllers: [ManagerController],
  providers: [ManagerService],
})
export class ManagerModule {}

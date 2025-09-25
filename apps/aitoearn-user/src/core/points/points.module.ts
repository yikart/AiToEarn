import { Global, Module } from '@nestjs/common'
import { PointsRecordRepository, UserRepository } from '@yikart/mongodb'
import { PointsController } from './points.controller'
import { PointsService } from './points.service'

@Global()
@Module({
  controllers: [PointsController],
  providers: [
    PointsService,
    UserRepository,
    PointsRecordRepository,
  ],
  exports: [PointsService],
})
export class PointsModule {}

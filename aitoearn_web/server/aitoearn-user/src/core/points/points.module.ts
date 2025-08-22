import { User, UserSchema } from '@libs/database/schema'
import { PointsRecord, PointsRecordSchema } from '@libs/database/schema/points-record.schema'
import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PointsController } from './points.controller'
import { PointsService } from './points.service'

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PointsRecord.name, schema: PointsRecordSchema },
    ]),
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}

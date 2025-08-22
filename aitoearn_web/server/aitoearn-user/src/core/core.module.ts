import { Module } from '@nestjs/common'
import { PointsModule } from './points/points.module'
import { UserModule } from './user/user.module'

@Module({
  imports: [UserModule, PointsModule],
  providers: [],
})
export class CoreModule { }

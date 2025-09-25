import { Module } from '@nestjs/common'
import { MongodbModule } from '@yikart/mongodb'
import { config } from './config'
import { IncomeModule } from './core/income/income.module'
import { PointsModule } from './core/points/points.module'
import { StorageModule } from './core/storage/storage.module'
import { UserModule } from './core/user/user.module'

@Module({
  imports: [
    MongodbModule.forRoot(config.mongodb),
    UserModule,
    PointsModule,
    IncomeModule,
    StorageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}

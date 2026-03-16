import { Module } from '@nestjs/common'
import { AssetsHttpModule } from '@yikart/assets'
import { UserType } from '@yikart/common'
import { config } from '../../config'

@Module({
  imports: [
    AssetsHttpModule.forRoot({
      assetsConfig: config.assets,
      userType: UserType.User,
      enableScheduler: true,
    }),
  ],
})
export class AssetsModule {}

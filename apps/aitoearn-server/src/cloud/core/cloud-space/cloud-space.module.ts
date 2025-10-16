import { Module } from '@nestjs/common'
import { HelpersModule } from '../../common/helpers/helpers.module'
import { CloudInstanceModule } from '../cloud-instance'
import { MultiloginAccountModule } from '../multilogin-account'
import { CloudSpaceController } from './cloud-space.controller'
import { CloudSpaceService } from './cloud-space.service'

@Module({
  imports: [
    CloudInstanceModule,
    MultiloginAccountModule,
    HelpersModule,
  ],
  controllers: [CloudSpaceController],
  providers: [CloudSpaceService],
  exports: [CloudSpaceService],
})
export class CloudSpaceModule {}

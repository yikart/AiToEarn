import { Module } from '@nestjs/common'
import { HelpersModule } from '../../common/helpers/helpers.module'
import { CloudInstanceModule } from '../cloud-instance'
import { MultiloginAccountModule } from '../multilogin-account'
import { CloudSpaceService } from './cloud-space.service'

@Module({
  imports: [
    CloudInstanceModule,
    MultiloginAccountModule,
    HelpersModule,
  ],
  providers: [CloudSpaceService],
  exports: [CloudSpaceService],
})
export class CloudSpaceModule {}

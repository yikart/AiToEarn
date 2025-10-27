import { Module } from '@nestjs/common'
import { UCloudModule } from '@yikart/ucloud'
import { config } from '../../../config'
import { CloudInstanceService } from './cloud-instance.service'

@Module({
  imports: [UCloudModule.forRoot(config.ucloud)],
  providers: [CloudInstanceService],
  exports: [CloudInstanceService],
})
export class CloudInstanceModule {}

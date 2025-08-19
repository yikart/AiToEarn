import { UCloudModule } from '@aitoearn/ucloud'
import { Module } from '@nestjs/common'
import { CloudInstanceService } from './cloud-instance.service'

@Module({
  imports: [UCloudModule],
  providers: [CloudInstanceService],
  exports: [CloudInstanceService],
})
export class CloudInstanceModule {}

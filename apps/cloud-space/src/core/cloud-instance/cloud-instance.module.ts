import { Module } from '@nestjs/common'
import { UCloudModule } from '@yikart/ucloud'
import { CloudInstanceService } from './cloud-instance.service'

@Module({
  imports: [UCloudModule],
  providers: [CloudInstanceService],
  exports: [CloudInstanceService],
})
export class CloudInstanceModule {}

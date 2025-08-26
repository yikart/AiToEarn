import { FingerprintModule } from '@core/fingerprint/fingerprint.module'
import { Module } from '@nestjs/common'
import { AccountModule } from './account/account.module'
import { TaskModule } from './task/task.module'

@Module({
  imports: [AccountModule, FingerprintModule, TaskModule],
  providers: [],
})
export class CoreModule {}

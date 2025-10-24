import { Module } from '@nestjs/common'
import { AccountInternalApi } from '../../transports/account/account.api'
import { TransportModule } from '../../transports/transport.module'
import { TestController } from './test.controller'
import { TestService } from './test.service'

@Module({
  imports: [TransportModule],
  controllers: [TestController],
  providers: [TestService, AccountInternalApi],
})
export class TestModule {}

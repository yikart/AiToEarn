import { Global, Module } from '@nestjs/common'
import { AccountModule } from '../statistics/accountData/accountData.module'
import { InternalService } from './internal.service'

@Global()
@Module({
  imports: [AccountModule],
  providers: [InternalService],
  controllers: [InternalService],
  exports: [InternalService],
})
export class InternalModule { }

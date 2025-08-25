import { Global, Module } from '@nestjs/common'
import { MultiloginHelper } from './multilogin.helper'

@Module({
  providers: [MultiloginHelper],
  exports: [MultiloginHelper],
})
@Global()
export class HelpersModule {}

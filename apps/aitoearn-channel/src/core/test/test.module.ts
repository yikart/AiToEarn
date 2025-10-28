import { Module } from '@nestjs/common'
import { TestController } from './test.controller'
import { TestService } from './test.service'

@Module({
  imports: [],
  controllers: [TestController],
  providers: [TestService],
})
export class TestModule {}

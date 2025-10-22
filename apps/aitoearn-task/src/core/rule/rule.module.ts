import { Global, Module } from '@nestjs/common'
import { RuleController } from './rule.controller'
import { RuleService } from './rule.service'

@Global()
@Module({
  imports: [
  ],
  controllers: [RuleController],
  providers: [RuleService],
  exports: [RuleService],
})
export class RuleModule {}

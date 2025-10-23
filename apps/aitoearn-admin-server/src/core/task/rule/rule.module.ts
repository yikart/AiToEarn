import { Module } from '@nestjs/common'
import { RuleController } from './rule.controller'
import { RuleService } from './rule.service'

@Module({
  controllers: [RuleController],
  providers: [RuleService],
  exports: [RuleService],
})
export class RuleModule {}

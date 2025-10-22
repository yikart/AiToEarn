import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AppException } from '@yikart/common'
import {
  CreateRuleDto,
  QueryRuleDto,
  UpdateRuleDto,
} from './rule.dto'
import { RuleService } from './rule.service'
import { RuleListVo, RuleVo } from './rule.vo'

@ApiTags('rule - 规则')
@Controller('rule')
export class RuleController {
  constructor(private readonly ruleService: RuleService) {}

  @Post('create')
  async create(@Body() body: CreateRuleDto): Promise<RuleVo> {
    const matcher = await this.ruleService.create(body)
    return RuleVo.create(matcher)
  }

  @Post('get')
  async get(@Body() body: { id: string }): Promise<RuleVo> {
    const matcher = await this.ruleService.findById(body.id)
    if (!matcher) {
      throw new AppException(1000, '任务匹配规则不存在')
    }
    return RuleVo.create(matcher)
  }

  @Post('update')
  async update(
    @Body() body: UpdateRuleDto,
  ): Promise<RuleVo> {
    const matcher = await this.ruleService.update(body)
    if (!matcher) {
      throw new AppException(1000, '任务匹配规则不存在')
    }
    return RuleVo.create(matcher)
  }

  @Post('delete')
  async delete(@Body() body: { id: string }) {
    await this.ruleService.delete(body.id)
  }

  @Post('list')
  async list(@Body() body: QueryRuleDto): Promise<RuleListVo> {
    const result = await this.ruleService.getList(body.page, body.filter)
    return result
  }
}

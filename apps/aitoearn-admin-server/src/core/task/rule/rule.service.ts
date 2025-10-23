import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { RuleApi } from '../../../transports/task/rule.api'
import {
  CreateRuleDto,
  QueryRuleDto,
  UpdateRuleDto,
} from './rule.dto'
import { RuleListVo, RuleVo } from './rule.vo'

@Injectable()
export class RuleService {
  constructor(private readonly ruleApi: RuleApi) {}

  async create(createDto: CreateRuleDto): Promise<RuleVo> {
    return await this.ruleApi.create(createDto)
  }

  async getById(id: string): Promise<RuleVo> {
    return await this.ruleApi.getById({ id })
  }

  async update(id: string, updateDto: UpdateRuleDto): Promise<RuleVo> {
    return await this.ruleApi.update(id, updateDto)
  }

  async delete(id: string) {
    return await this.ruleApi.delete({ id })
  }

  async getList(page: TableDto, query: QueryRuleDto): Promise<RuleListVo> {
    return await this.ruleApi.list(page, query)
  }
}

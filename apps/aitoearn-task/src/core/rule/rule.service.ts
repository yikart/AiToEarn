import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { Rule, RuleRepository } from '@yikart/task-db'
import {
  CreateRuleDto,
  QueryRuleFilterDto,
  UpdateRuleDto,
} from './rule.dto'

@Injectable()
export class RuleService {
  constructor(
    private readonly ruleRepository: RuleRepository,
  ) { }

  async create(createDto: CreateRuleDto): Promise<Rule> {
    return (await this.ruleRepository.create(createDto)).toJSON()
  }

  async findById(id: string): Promise<Rule | null> {
    return await this.ruleRepository.findById(id)
  }

  async update(updateDto: UpdateRuleDto): Promise<Rule | null> {
    return await this.ruleRepository
      .updateById(updateDto.id, updateDto)
  }

  async delete(id: string) {
    await this.ruleRepository.delete(id)
  }

  async getList(page: TableDto, filter: QueryRuleFilterDto) {
    return await this.ruleRepository.getList(page, filter)
  }
}

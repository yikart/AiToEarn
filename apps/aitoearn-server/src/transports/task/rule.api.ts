import { Injectable } from '@nestjs/common'
import { CreateRuleDto, QueryRuleDto, UpdateRuleDto } from '../../core/task/rule/rule.dto'
import { RuleListVo, RuleVo } from '../../core/task/rule/rule.vo'
import { TaskBaseApi } from '../taskBase.api'

@Injectable()
export class RuleApi extends TaskBaseApi {
  async create(data: CreateRuleDto): Promise<RuleVo> {
    return await this.sendMessage<RuleVo>(
      'task/rule/create',
      data,
    )
  }

  async getById(data: { id: string }): Promise<RuleVo> {
    return await this.sendMessage<RuleVo>(
      'task/rule/get',
      data,
    )
  }

  async update(id: string, data: UpdateRuleDto): Promise<RuleVo> {
    return await this.sendMessage<RuleVo>(
      'task/rule/update',
      {
        id,
        ...data,
      },
    )
  }

  async delete(data: { id: string }) {
    return await this.sendMessage(
      'task/rule/delete',
      data,
    )
  }

  async list(page: {
    pageNo: number
    pageSize: number
  }, filter: QueryRuleDto): Promise<RuleListVo> {
    return await this.sendMessage<RuleListVo>(
      'task/rule/list',
      {
        page,
        filter,
      },
    )
  }
}

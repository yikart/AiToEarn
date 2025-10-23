import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { PortraitApi } from '../../../transports/task/portrait.api'
import { AccountPortraitListFilterDto } from './portrait.dto'

@Injectable()
export class AccountPortraitService {
  constructor(private readonly portraitApi: PortraitApi) {}

  async getList(page: TableDto, filter: AccountPortraitListFilterDto) {
    return await this.portraitApi.getAccountPortraitList(page, filter)
  }

  async getById(id: string) {
    return await this.portraitApi.getAccountPortraitById(id)
  }
}

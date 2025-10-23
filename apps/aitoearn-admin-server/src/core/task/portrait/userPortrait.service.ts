import { Injectable } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { PortraitApi } from '../../../transports/task/portrait.api'
import { UserPortraitListFilterDto } from './portrait.dto'

@Injectable()
export class UserPortraitService {
  constructor(private readonly portraitApi: PortraitApi) {}

  async getList(page: TableDto, filter: UserPortraitListFilterDto) {
    return await this.portraitApi.getUserPortraitList(page, filter)
  }

  async getById(userId: string) {
    return await this.portraitApi.getUserPortraitById(userId)
  }
}

import { Injectable } from '@nestjs/common'
import { CreateSubscriberDto, GetSubscribersDto, GetSubscribersResponse, Subscriber } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class SubscribersService extends BaseService {
  async findAll(params?: GetSubscribersDto): Promise<GetSubscribersResponse> {
    return this.request<GetSubscribersResponse>('/api/subscribers', {
      method: 'GET',
      params,
    })
  }

  async create(data: CreateSubscriberDto): Promise<Subscriber> {
    return this.request<Subscriber>('/api/subscribers', {
      method: 'POST',
      data,
    })
  }

  async findByEmail(email: string): Promise<Subscriber | null> {
    const { results } = await this.findAll({
      query: `subscribers.email = '${email}'`,
      per_page: 1,
    })
    return results[0] || null
  }
}

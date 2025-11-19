import { Injectable } from '@nestjs/common'
import { CreateSubscriberDto, Subscriber } from '../interfaces'
import { BaseService } from './base.service'

@Injectable()
export class SubscribersService extends BaseService {
  async create(data: CreateSubscriberDto): Promise<Subscriber> {
    return this.request<Subscriber>('/api/subscribers', {
      method: 'POST',
      data,
    })
  }
}

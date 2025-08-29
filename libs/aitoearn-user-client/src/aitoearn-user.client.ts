import { Injectable } from '@nestjs/common'
import { NatsClient } from '@yikart/nats-client'
import { IdDto, User } from './aitoearn-user-client.interfaces'

@Injectable()
export class AitoearnUserClient {
  constructor(private readonly natsClient: NatsClient) {}

  async getUserById(dto: IdDto): Promise<User> {
    return this.natsClient.send<User>('user.user.getUserInfoById', dto)
  }
}

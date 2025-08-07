import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UserCreatedEvent } from '@/transports/user/comment'
import { UserNatsApi } from '@/transports/user/user.natsApi'

@Injectable()
export class TestService {
  constructor(private readonly userNatsApi: UserNatsApi, private eventEmitter: EventEmitter2) { }

  async addDefaultContent() {
    const res = await this.userNatsApi.getUserInfoById(
      '6890bb09bd3530b1fc1e7c36',
    )
    this.eventEmitter.emit(
      'user.created',
      new UserCreatedEvent(res),
    )
    return res
  }
}

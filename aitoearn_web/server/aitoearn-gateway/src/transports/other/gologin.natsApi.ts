import { Injectable } from '@nestjs/common'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'

@Injectable()
export class GologinNatsApi {
  constructor(private readonly natsService: NatsService) {}

  async doTest() {
    const res = await this.natsService.sendMessage<any>(
      NatsApi.other.gologin.doTest,
      {},
    )

    return res
  }
}

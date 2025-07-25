import { Injectable } from '@nestjs/common'
import { PlatTwitterNatsApi } from 'src/transports/plat/twitter.natsApi'

@Injectable()
export class TwitterService {
  constructor(private readonly platTwitterNatsApi: PlatTwitterNatsApi) {}
}

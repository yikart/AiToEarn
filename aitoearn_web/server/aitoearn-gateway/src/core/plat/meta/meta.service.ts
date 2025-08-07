import { Injectable } from '@nestjs/common'
import { PlatMetaNatsApi } from 'src/transports/channel/meta.natsApi'

@Injectable()
export class MetaService {
  constructor(private readonly platMetaNatsApi: PlatMetaNatsApi) {}
}

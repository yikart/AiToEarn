import { Injectable } from '@nestjs/common'
import { PlatKwaiNatsApi } from '../../../transports/plat/kwai.natsApi'

@Injectable()
export class KwaiService {
  constructor(private readonly platKwaiNatsApi: PlatKwaiNatsApi) {}
}

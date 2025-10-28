import { Injectable } from '@nestjs/common'
import { AitoearnServerClientConfig } from './aitoearn-server-client.config'

@Injectable()
export class AitoearnServerClientService {
  constructor(
    private readonly config: AitoearnServerClientConfig,
  ) {}
}

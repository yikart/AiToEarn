import { Injectable } from '@nestjs/common'

import { MultiloginClient } from './clients'
import { MultiloginConfig } from './multilogin.config'

@Injectable()
export class MultiloginService {
  private readonly accounts: Map<string, MultiloginClient> = new Map()

  constructor(
    private readonly config: MultiloginConfig,
  ) {}

  async getAccount(
    username: string,
    password: string,
    automationToken?: string,
  ): Promise<MultiloginClient> {
    return new MultiloginClient({
      email: username,
      password,
      token: automationToken,
      ...this.config,
    })
  }
}

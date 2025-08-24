import { MultiloginAccountRepository } from '@aitoearn/mongodb'
import { MultiloginClient } from '@aitoearn/multilogin'
import { Injectable } from '@nestjs/common'
import { config } from '../../config'

interface Account {
  id: string
  email: string
  password: string
  token?: string
}

@Injectable()
export class MultiloginHelper {
  private readonly accounts: Map<Account, MultiloginClient> = new Map()
  private readonly config = config.multilogin

  constructor(
    private readonly multiloginAccountRepo: MultiloginAccountRepository,
  ) {}

  async withAccount(config: Account): Promise<MultiloginClient> {
    const account = this.accounts.get(config)
    if (account) {
      return account
    }

    const client = new MultiloginClient({
      ...config,
      ...this.config,
      onTokenRefresh: async (token: string) => {
        config.token = token
        await this.multiloginAccountRepo.updateById(config.id, { token })
      },
    })
    this.accounts.set(config, client)
    return client
  }
}

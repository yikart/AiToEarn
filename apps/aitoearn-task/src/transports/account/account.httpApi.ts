import { Injectable } from '@nestjs/common'
import { ServerBaseApi } from '../serverBase.api'
import { Account } from './comment'

@Injectable()
export class AccountHttpApi extends ServerBaseApi {
  async getAccountInfoById(accountId: string) {
    const res = await this.sendMessage<Account>(`internal/account/info`, { id: accountId })
    return res
  }
}

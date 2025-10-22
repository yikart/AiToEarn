import { Injectable } from '@nestjs/common'
import { TransportsService } from '../transports.service'
import { Account } from './comment'

@Injectable()
export class AccountHttpApi extends TransportsService {
  /**
   * TODO: 根据用户id获取账号
   */
  async getAccountInfoById(accountId: string) {
    const res = await this.aitoearnServerRequest<Account>('get', `/account/${accountId}`)
    return res
  }

  // TODO: 根据用户id获取账号
  async listByIds(ids: string[]) {
    const res = await this.aitoearnServerRequest<Account[]>(
      'post',
      `/account/listByIds`,
      { ids },
    )
    return res
  }
}

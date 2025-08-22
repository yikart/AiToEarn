import { Injectable } from '@nestjs/common'
import { AccountGroup } from 'src/core/account/accountGroup/comment'
import { NatsApi } from '../api'
import { BaseNatsApi } from '../base.natsApi'

@Injectable()
export class AccountGroupNatsApi extends BaseNatsApi {
  /**
   * 添加或者更新组
   * @param accountGroup
   */
  async createGroup(newData: Partial<AccountGroup>) {
    const res = await this.sendMessage<AccountGroup>(
      NatsApi.account.group.create,
      newData,
    )

    return res
  }

  /**
   * 添加或者更新组
   * @param id
   * @param newData
   */
  async updateGroup(id: string, newData: Partial<AccountGroup>) {
    const res = await this.sendMessage<AccountGroup>(
      NatsApi.account.group.update,
      { id, ...newData },
    )

    return res
  }

  /**
   * 删除多个组
   * @param ids
   * @param userId
   */
  async deleteAccountGroup(ids: string[], userId: string) {
    const res = await this.sendMessage<boolean>(
      NatsApi.account.group.deleteList,
      { ids, userId },
    )

    return res
  }

  // 获取所有组
  async getAccountGroup(userId: string) {
    const res = await this.sendMessage<AccountGroup[]>(
      NatsApi.account.group.getList,
      { userId },
    )

    return res
  }
}

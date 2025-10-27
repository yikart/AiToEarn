import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { AccountGroup, AccountGroupRepository } from '@yikart/mongodb'
import { FingerprintService } from '../fingerprint/fingerprint.service'
import { AccountService } from './account.service'

@Injectable()
export class AccountGroupService {
  constructor(
    @Inject(forwardRef(() => AccountService))
    private readonly accountService: AccountService,
    private readonly fingerprintService: FingerprintService,
    private readonly accountGroupRepository: AccountGroupRepository,
  ) { }

  // 获取默认用户组, 没有则创建
  async getDefaultGroup(userId: string): Promise<AccountGroup> {
    const data = await this.accountGroupRepository.getDefaultGroup(userId)
    return data
  }

  /**
   * 添加组
   * @param accountGroup
   */
  async createAccountGroup(
    accountGroup: Partial<AccountGroup>,
  ): Promise<AccountGroup> {
    if (!accountGroup.browserConfig) {
      accountGroup.browserConfig = await this.fingerprintService.generateFingerprint()
    }
    const data = await this.accountGroupRepository.createAccountGroup(accountGroup)
    return data
  }

  async updateAccountGroup(
    id: string,
    accountGroup: Partial<AccountGroup>,
  ): Promise<boolean> {
    const data = await this.accountGroupRepository.updateAccountGroup(id, accountGroup)
    return data
  }

  /**
   * 删除多个组
   * @param ids
   * @param userId
   */
  async deleteAccountGroup(ids: string[], userId: string): Promise<boolean> {
    const accountGroupList = await this.accountGroupRepository.getAccountGorupListByIds(ids, userId)
    // 默认用户组
    const defaultGroup = await this.getDefaultGroup(userId)
    // 将删除的组下面的账户切换为默认组
    for (const group of accountGroupList) {
      await this.accountService.switchToDefaultGroup(
        userId,
        group.id,
        defaultGroup.id,
      )
    }

    const data = await this.accountGroupRepository.deleteAccountGroup(ids, userId)
    return data
  }

  /**
   * 获取所有组
   * @param userId
   * @returns
   */
  async getAccountGroup(userId: string): Promise<AccountGroup[]> {
    const accountGroupList: AccountGroup[] = await this.accountGroupRepository.getAccountGroup(userId)
    return accountGroupList
  }

  // 排序
  async sortRank(userId: string, list: { id: string, rank: number }[]): Promise<boolean> {
    const success = await this.accountGroupRepository.sortRank(userId, list)
    return success
  }
}

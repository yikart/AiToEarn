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

  // Find group by ID
  async findOneById(id: string) {
    const data = await this.accountGroupRepository.findOneById(id)
    return data
  }

  // Get default user group, create if not exists
  async getDefaultGroup(userId: string): Promise<AccountGroup> {
    const data = await this.accountGroupRepository.getDefaultGroup(userId)
    return data
  }

  /**
   * Add group
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
    group: AccountGroup,
    upData: Partial<AccountGroup>,
  ): Promise<boolean> {
    const data = await this.accountGroupRepository.updateAccountGroup(group.id, upData)
    return data
  }

  /**
   * Delete multiple groups
   * @param ids
   * @param userId
   */
  async deleteAccountGroup(ids: string[], userId: string): Promise<boolean> {
    const accountGroupList = await this.accountGroupRepository.getAccountGorupListByIds(ids, userId)
    // Default user group
    const defaultGroup = await this.getDefaultGroup(userId)
    // Switch accounts under deleted groups to default group
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
   * Get all groups
   * @param userId
   * @returns
   */
  async getAccountGroup(userId: string): Promise<AccountGroup[]> {
    const accountGroupList: AccountGroup[] = await this.accountGroupRepository.getAccountGroup(userId)
    return accountGroupList
  }

  // Sort
  async sortRank(userId: string, list: { id: string, rank: number }[]): Promise<boolean> {
    const success = await this.accountGroupRepository.sortRank(userId, list)
    return success
  }
}

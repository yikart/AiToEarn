import type { AccountGroup } from '@yikart/mongodb'
import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { AccountGroupRepository, AccountRepository, Transactional } from '@yikart/mongodb'
import { ChannelAccountGroupCreateDto, ChannelAccountGroupUpdateDto } from './account-group.dto'

@Injectable()
export class AccountGroupService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountGroupRepository: AccountGroupRepository,
  ) {}

  async create(userId: string, data: ChannelAccountGroupCreateDto): Promise<AccountGroup> {
    return this.accountGroupRepository.createAccountGroup({
      ...data,
      userId,
    })
  }

  async update(userId: string, groupId: string, data: ChannelAccountGroupUpdateDto): Promise<AccountGroup> {
    const group = await this.getOwnedGroup(userId, groupId)
    const updated = await this.accountGroupRepository.updateAccountGroup(group.id, data)
    if (!updated) {
      throw new AppException(ResponseCode.AccountGroupNotFound)
    }
    return { ...group, ...data }
  }

  @Transactional()
  async deleteMany(userId: string, groupIds: string[]): Promise<boolean> {
    const groups = await this.accountGroupRepository.getAccountGorupListByIds(groupIds, userId)
    const defaultGroup = await this.accountGroupRepository.getDefaultGroup(userId)
    if (groups.some(group => group.isDefault || group.id === defaultGroup.id)) {
      throw new AppException(ResponseCode.AccountGroupNotFound, {
        reasonCode: 'default_group_delete_not_allowed',
      })
    }
    for (const group of groups) {
      await this.accountRepository.updateManyToDefaultGroup(userId, group.id, defaultGroup.id)
    }
    return this.accountGroupRepository.deleteAccountGroup(groupIds, userId)
  }

  async list(userId: string): Promise<AccountGroup[]> {
    const groups = await this.accountGroupRepository.getAccountGroup(userId)
    return groups
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  }

  @Transactional()
  async sortAccounts(userId: string, groupId: string, list: { id: string, rank: number }[]): Promise<boolean> {
    await this.getOwnedGroup(userId, groupId)
    const ids = list.map(item => item.id)
    if (new Set(ids).size !== ids.length) {
      throw new AppException(ResponseCode.ValidationFailed)
    }

    const accounts = await this.accountRepository.listByUserIdAndIds(userId, ids)
    const accountMap = new Map(accounts.map(account => [account.id, account]))
    for (const id of ids) {
      const account = accountMap.get(id)
      if (!account || account.groupId !== groupId) {
        throw new AppException(ResponseCode.AccountNotFound)
      }
    }

    const updated = await this.accountRepository.updateManyRankByIds(userId, groupId, list)
    if (!updated) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    return true
  }

  async findOneById(id: string) {
    return this.accountGroupRepository.getById(id)
  }

  async getDefaultGroup(userId: string): Promise<AccountGroup> {
    return this.accountGroupRepository.getDefaultGroup(userId)
  }

  async getAccountGroup(userId: string): Promise<AccountGroup[]> {
    return this.accountGroupRepository.getAccountGroup(userId)
  }

  async sortRank(userId: string, list: { id: string, rank: number }[]): Promise<boolean> {
    return this.accountGroupRepository.sortRank(userId, list)
  }

  async getAccountGroupByName(userId: string, name: string): Promise<AccountGroup[]> {
    return this.accountGroupRepository.getAccountGroupByName(userId, name)
  }

  private async getOwnedGroup(userId: string, groupId: string): Promise<AccountGroup> {
    const groups = await this.accountGroupRepository.getAccountGorupListByIds([groupId], userId)
    const group = groups[0]
    if (!group) {
      throw new AppException(ResponseCode.AccountGroupNotFound)
    }
    return group
  }
}

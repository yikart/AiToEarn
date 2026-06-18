import { ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { AccountGroupService } from './account-group.service'

vi.mock('@yikart/mongodb', () => ({
  AccountGroupRepository: class AccountGroupRepository {},
  AccountRepository: class AccountRepository {},
  Transactional: () => () => undefined,
}))

describe('account group service', () => {
  it('rejects deleting the default account group', async () => {
    const accountRepository = {
      updateManyToDefaultGroup: vi.fn(),
    }
    const accountGroupRepository = {
      getAccountGorupListByIds: vi.fn(async () => [{
        id: 'group-default',
        userId: 'user-1',
        isDefault: true,
      }]),
      getDefaultGroup: vi.fn(async () => ({
        id: 'group-default',
        userId: 'user-1',
        isDefault: true,
      })),
      deleteAccountGroup: vi.fn(),
    }
    const service = new AccountGroupService(
      accountRepository as never,
      accountGroupRepository as never,
    )

    await expect(service.deleteMany('user-1', ['group-default']))
      .rejects
      .toMatchObject({ code: ResponseCode.AccountGroupNotFound })

    expect(accountRepository.updateManyToDefaultGroup).not.toHaveBeenCalled()
    expect(accountGroupRepository.deleteAccountGroup).not.toHaveBeenCalled()
  })

  it('sorts only accounts owned by the user and target group', async () => {
    const accountRepository = {
      listByUserIdAndIds: vi.fn(async () => [
        { id: 'account-1', userId: 'user-1', groupId: 'group-1' },
        { id: 'account-2', userId: 'user-1', groupId: 'group-1' },
      ]),
      updateManyRankByIds: vi.fn(async () => true),
    }
    const accountGroupRepository = {
      getAccountGorupListByIds: vi.fn(async () => [{ id: 'group-1', userId: 'user-1' }]),
    }
    const service = new AccountGroupService(
      accountRepository as never,
      accountGroupRepository as never,
    )

    await expect(service.sortAccounts('user-1', 'group-1', [
      { id: 'account-1', rank: 1 },
      { id: 'account-2', rank: 2 },
    ])).resolves.toBe(true)

    expect(accountRepository.listByUserIdAndIds).toHaveBeenCalledWith('user-1', ['account-1', 'account-2'])
    expect(accountRepository.updateManyRankByIds).toHaveBeenCalledWith('user-1', 'group-1', [
      { id: 'account-1', rank: 1 },
      { id: 'account-2', rank: 2 },
    ])
  })

  it('rejects sorting accounts outside the target group', async () => {
    const accountRepository = {
      listByUserIdAndIds: vi.fn(async () => [
        { id: 'account-1', userId: 'user-1', groupId: 'other-group' },
      ]),
      updateManyRankByIds: vi.fn(),
    }
    const accountGroupRepository = {
      getAccountGorupListByIds: vi.fn(async () => [{ id: 'group-1', userId: 'user-1' }]),
    }
    const service = new AccountGroupService(
      accountRepository as never,
      accountGroupRepository as never,
    )

    await expect(service.sortAccounts('user-1', 'group-1', [{ id: 'account-1', rank: 1 }]))
      .rejects
      .toMatchObject({ code: ResponseCode.AccountNotFound })

    expect(accountRepository.updateManyRankByIds).not.toHaveBeenCalled()
  })
})

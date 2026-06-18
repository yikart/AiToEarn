import type { Model } from 'mongoose'
import type { AccountGroup } from '../schemas/account-group.schema'
import { describe, expect, it, vi } from 'vitest'
import { AccountGroupRepository } from './account-group.repository'

vi.mock('../schemas/account-group.schema', () => ({
  AccountGroup: class AccountGroup {},
}))

describe('account group repository', () => {
  it('returns a plain object when creating an account group', async () => {
    const accountGroup = {
      id: 'group-1',
      userId: 'user-1',
      name: 'group-name',
      isDefault: false,
      rank: 1,
    }
    const created = {
      $__: {},
      _doc: accountGroup,
      toObject: vi.fn(() => accountGroup),
    }
    const model = {
      create: vi.fn(async () => created),
    }
    const repository = new AccountGroupRepository(model as unknown as Model<AccountGroup>)

    const result = await repository.createAccountGroup({
      userId: 'user-1',
      name: 'group-name',
    })

    expect(model.create).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'group-name',
    })
    expect(created.toObject).toHaveBeenCalled()
    expect(result).toEqual(accountGroup)
    expect(result).not.toHaveProperty('$__')
    expect(result).not.toHaveProperty('_doc')
  })
})

import type { Model } from 'mongoose'
import type { Account } from '../schemas'
import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { ClientType } from '../schemas'
import { AccountRepository } from './account.repository'

vi.mock('../schemas', () => ({
  Account: class Account {},
  AccountStatus: {
    NORMAL: 1,
    ABNORMAL: 0,
  },
  ClientType: {
    WEB: 'web',
    APP: 'app',
  },
}))

function createRepository() {
  const exec = vi.fn(async () => ({ id: 'account-1' }))
  const lean = vi.fn(() => ({ exec }))
  const saved = {
    toObject: vi.fn(() => ({ id: 'account-1' })),
  }
  const save = vi.fn(async () => saved)
  const findOne = vi.fn(() => ({ lean }))
  const findOneAndUpdate = vi.fn(() => ({ lean }))
  const AccountModel = vi.fn(function AccountModel(this: { save: typeof save, data: unknown }, data: unknown) {
    this.data = data
    this.save = save
  })
  const model = Object.assign(AccountModel, {
    findOne,
    findOneAndUpdate,
  })
  const repository = new AccountRepository(model as unknown as Model<Account>)

  return { repository, model, findOne, findOneAndUpdate, exec, lean, save, saved }
}

describe('account repository', () => {
  it('gets accounts by the stable identity id or persisted identity fields', async () => {
    const { repository, findOne } = createRepository()

    await repository.getByIdentity({
      type: AccountType.YouTube,
      uid: 'google-user-id',
      account: 'channel-id',
    })

    expect(findOne).toHaveBeenCalledWith({
      $or: [
        { _id: 'youtube_google-user-id_channel-id' },
        {
          type: AccountType.YouTube,
          uid: 'google-user-id',
          account: 'channel-id',
        },
      ],
    })
  })

  it('keeps RedNote client type in identity field lookup', async () => {
    const { repository, findOne } = createRepository()

    await repository.getByIdentity({
      type: AccountType.RedNote,
      uid: 'rednote-user-id',
      clientType: ClientType.WEB,
    })

    expect(findOne).toHaveBeenCalledWith({
      $or: [
        { _id: 'xhs_rednote-user-id_web' },
        {
          type: AccountType.RedNote,
          uid: 'rednote-user-id',
          account: null,
          clientType: ClientType.WEB,
        },
      ],
    })
  })

  it('creates accounts with the identity id and lets schema defaults apply', async () => {
    const { repository, model, save, saved } = createRepository()

    const result = await repository.createByIdentity(
      { type: AccountType.YouTube, uid: 'google-user-id', account: 'channel-id' },
      {
        userId: 'user-1',
        type: AccountType.YouTube,
        uid: 'google-user-id',
        account: 'channel-id',
        nickname: 'Channel',
        groupId: 'group-1',
      },
    )

    expect(model).toHaveBeenCalledWith({
      _id: 'youtube_google-user-id_channel-id',
      userId: 'user-1',
      type: AccountType.YouTube,
      uid: 'google-user-id',
      account: 'channel-id',
      nickname: 'Channel',
      groupId: 'group-1',
    })
    expect(save).toHaveBeenCalled()
    expect(saved.toObject).toHaveBeenCalled()
    expect(result).toEqual({ id: 'account-1' })
  })

  it('keeps the RedNote client type in the local identity id', async () => {
    const { repository, model } = createRepository()

    await repository.createByIdentity(
      {
        type: AccountType.RedNote,
        uid: 'rednote-user-id',
        clientType: ClientType.WEB,
      },
      {
        userId: 'user-1',
        type: AccountType.RedNote,
        uid: 'rednote-user-id',
        clientType: ClientType.WEB,
        nickname: 'RedNote',
        groupId: 'group-1',
      },
    )

    expect(model).toHaveBeenCalledWith(expect.objectContaining({
      _id: 'xhs_rednote-user-id_web',
      clientType: 'web',
    }))
  })

  it('updates existing accounts by the identity id or persisted identity fields', async () => {
    const { repository, findOneAndUpdate } = createRepository()

    await repository.updateByIdentity(
      { type: AccountType.Twitter, uid: 'twitter-user-id' },
      {
        userId: 'user-1',
        nickname: 'Twitter User',
      },
    )

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      {
        $or: [
          { _id: 'twitter_twitter-user-id' },
          {
            type: AccountType.Twitter,
            uid: 'twitter-user-id',
            account: null,
          },
        ],
      },
      {
        $set: {
          userId: 'user-1',
          nickname: 'Twitter User',
        },
      },
      { new: true },
    )
  })
})

import { AccountType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { AccountStatus } from '../schemas'
import { OAuth2CredentialRepository } from './oauth2-credential.repository'

vi.mock('../schemas', () => ({
  AccountStatus: {
    NORMAL: 1,
    ABNORMAL: 0,
  },
  OAuth2Credential: class OAuth2Credential {},
}))

describe('oAuth2CredentialRepository', () => {
  it('lists expiring credentials only for normal existing accounts', async () => {
    const records = [{
      accountId: 'account-1',
      platform: AccountType.Facebook,
      accessTokenExpiresAt: 1767225600,
    }]
    const exec = vi.fn(async () => records)
    const model = {
      aggregate: vi.fn(() => ({ exec })),
    }
    const repo = new OAuth2CredentialRepository(model as never)

    await expect(repo.listByAccessTokenExpiresAtAndNormalAccount(1767229200, 100))
      .resolves
      .toBe(records)

    expect(model.aggregate).toHaveBeenCalledWith([
      {
        $match: {
          accessTokenExpiresAt: { $type: 'number', $lte: 1767229200 },
          refreshToken: { $type: 'string', $ne: '' },
        },
      },
      { $sort: { accessTokenExpiresAt: 1, _id: 1 } },
      {
        $lookup: {
          from: 'account',
          localField: 'accountId',
          foreignField: '_id',
          as: 'account',
        },
      },
      { $unwind: '$account' },
      { $match: { 'account.status': AccountStatus.NORMAL } },
      { $limit: 100 },
      { $addFields: { cursorId: '$_id' } },
      { $project: { account: 0 } },
    ])
  })

  it('continues listing expiring credentials from the previous expiry cursor', async () => {
    const exec = vi.fn(async () => [])
    const model = {
      aggregate: vi.fn(() => ({ exec })),
    }
    const repo = new OAuth2CredentialRepository(model as never)

    await repo.listByAccessTokenExpiresAtAndNormalAccount(1767229200, 100, {
      accessTokenExpiresAt: 1767225600,
      cursorId: 'cursor-id',
    })

    expect(model.aggregate).toHaveBeenCalledWith([
      {
        $match: {
          accessTokenExpiresAt: { $type: 'number', $lte: 1767229200 },
          refreshToken: { $type: 'string', $ne: '' },
          $or: [
            { accessTokenExpiresAt: { $gt: 1767225600 } },
            {
              accessTokenExpiresAt: 1767225600,
              _id: { $gt: 'cursor-id' },
            },
          ],
        },
      },
      { $sort: { accessTokenExpiresAt: 1, _id: 1 } },
      {
        $lookup: {
          from: 'account',
          localField: 'accountId',
          foreignField: '_id',
          as: 'account',
        },
      },
      { $unwind: '$account' },
      { $match: { 'account.status': AccountStatus.NORMAL } },
      { $limit: 100 },
      { $addFields: { cursorId: '$_id' } },
      { $project: { account: 0 } },
    ])
  })
})

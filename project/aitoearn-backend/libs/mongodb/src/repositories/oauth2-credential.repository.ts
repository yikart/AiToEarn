import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountType } from '@yikart/common'
import { Model } from 'mongoose'
import { AccountStatus, OAuth2Credential } from '../schemas'
import { BaseRepository } from './base.repository'

export interface OAuth2CredentialExpiryCursor {
  accessTokenExpiresAt: number
  cursorId: unknown
}

export type OAuth2CredentialExpiryRecord = OAuth2Credential & OAuth2CredentialExpiryCursor

@Injectable()
export class OAuth2CredentialRepository extends BaseRepository<OAuth2Credential> {
  constructor(
    @InjectModel(OAuth2Credential.name) oauth2CredentialModel: Model<OAuth2Credential>,
  ) {
    super(oauth2CredentialModel)
  }

  async getByAccountId(accountId: string) {
    return await this.findOne({ accountId })
  }

  async getByAccountIdAndPlatform(accountId: string, platform: AccountType) {
    return await this.findOne({ accountId, platform })
  }

  async listByAccountIds(accountIds: string[]) {
    return await this.find({ accountId: { $in: accountIds } })
  }

  async listByAccessTokenExpiresAt(beforeTimestamp: number, limit: number) {
    return await this.find({
      accessTokenExpiresAt: { $type: 'number', $lte: beforeTimestamp },
      refreshToken: { $type: 'string', $ne: '' },
    }, {
      sort: { accessTokenExpiresAt: 1, _id: 1 },
      limit,
    })
  }

  async listByAccessTokenExpiresAtAndNormalAccount(
    beforeTimestamp: number,
    limit: number,
    cursor?: OAuth2CredentialExpiryCursor,
  ) {
    const match: Record<string, unknown> = {
      accessTokenExpiresAt: { $type: 'number', $lte: beforeTimestamp },
      refreshToken: { $type: 'string', $ne: '' },
    }
    if (cursor) {
      match['$or'] = [
        { accessTokenExpiresAt: { $gt: cursor.accessTokenExpiresAt } },
        {
          accessTokenExpiresAt: cursor.accessTokenExpiresAt,
          _id: { $gt: cursor.cursorId },
        },
      ]
    }

    return await this.model.aggregate<OAuth2CredentialExpiryRecord>([
      {
        $match: match,
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
      { $limit: limit },
      { $addFields: { cursorId: '$_id' } },
      { $project: { account: 0 } },
    ]).exec()
  }

  async createOrUpdateByAccountId(
    accountId: string,
    platform: AccountType,
    credentialData: Partial<OAuth2Credential>,
  ) {
    const setData = Object.fromEntries(
      Object.entries(credentialData).filter(([, value]) => value !== undefined),
    )
    const unsetData = Object.fromEntries(
      Object.entries(credentialData)
        .filter(([, value]) => value === undefined)
        .map(([key]) => [key, '']),
    )

    return await this.updateOne(
      { accountId },
      {
        $set: {
          platform,
          ...setData,
        },
        ...(Object.keys(unsetData).length > 0 && { $unset: unsetData }),
        $setOnInsert: { accountId },
      },
      { upsert: true },
    )
  }

  async deleteByAccountId(accountId: string): Promise<boolean> {
    const result = await this.deleteOne({ accountId })
    return result.deletedCount > 0
  }
}

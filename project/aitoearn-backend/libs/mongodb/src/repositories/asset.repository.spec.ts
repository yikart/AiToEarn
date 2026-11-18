import type { Model } from 'mongoose'
import type { Asset } from '../schemas'
import { ResponseCode, UserType } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { AssetStatus, AssetType } from '../enums'
import { AssetRepository } from './asset.repository'

vi.mock('../schemas', () => ({
  Asset: class Asset {},
}))

function createRepository(existingAsset: Partial<Asset> | null) {
  const findExec = vi.fn(async () => existingAsset)
  const findLean = vi.fn(() => ({ exec: findExec }))
  const findOne = vi.fn(() => ({ lean: findLean }))
  const updateExec = vi.fn(async () => ({ id: 'asset-1', ...existingAsset, deletedAt: undefined }))
  const updateLean = vi.fn(() => ({ exec: updateExec }))
  const findByIdAndUpdate = vi.fn(() => ({ lean: updateLean }))
  const model = { findOne, findByIdAndUpdate } as unknown as Model<Asset>
  const repository = new AssetRepository(model)

  return { repository, findOne, findByIdAndUpdate }
}

const params = {
  path: 'users/owner/video.mp4',
  userId: 'owner',
  userType: UserType.User,
  type: AssetType.Temp,
  status: AssetStatus.Confirmed,
  size: 10,
  mimeType: 'video/mp4',
}

describe('asset repository upsertByPath', () => {
  it('does not return or reassign an asset owned by another user', async () => {
    const existing = {
      id: 'asset-1',
      path: params.path,
      userId: 'other-user',
      userType: UserType.User,
      deletedAt: new Date(),
    } as Partial<Asset>
    const { repository, findByIdAndUpdate } = createRepository(existing)

    await expect(repository.upsertByPath(params))
      .rejects
      .toMatchObject({ response: { code: ResponseCode.AssetNotFound } })
    expect(findByIdAndUpdate).not.toHaveBeenCalled()
  })

  it('restores a soft-deleted asset only for its original owner', async () => {
    const existing = {
      id: 'asset-1',
      path: params.path,
      userId: params.userId,
      userType: params.userType,
      deletedAt: new Date(),
    } as Partial<Asset>
    const { repository, findByIdAndUpdate } = createRepository(existing)

    await expect(repository.upsertByPath(params)).resolves.toMatchObject({ id: 'asset-1' })
    expect(findByIdAndUpdate).toHaveBeenCalledWith('asset-1', {
      $set: params,
      $unset: { deletedAt: '' },
    }, { new: true })
  })
})

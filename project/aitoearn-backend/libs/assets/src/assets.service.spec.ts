import { ResponseCode, UserType } from '@yikart/common'
import { AssetStatus, AssetType } from '@yikart/mongodb'
import { describe, expect, it, vi } from 'vitest'
import { AssetsService } from './assets.service'

vi.mock('@yikart/mongodb', () => ({
  Asset: class Asset {},
  AssetRepository: class AssetRepository {},
  AssetStatus: { Confirmed: 'confirmed' },
  AssetType: { Temp: 'temp' },
}))

function createService(existingAsset: Record<string, unknown> | null) {
  const storage = {
    headObject: vi.fn(async () => ({ contentLength: 10, contentType: 'video/mp4' })),
  }
  const assetRepository = {
    getByPath: vi.fn(async () => existingAsset),
    upsertByPath: vi.fn(async () => ({ id: 'asset-1' })),
  }
  const service = new AssetsService(
    storage as never,
    assetRepository as never,
    {} as never,
    {} as never,
  )
  return { service, storage, assetRepository }
}

describe('assetsService.getOrCreateAssetByPath', () => {
  it('does not return an existing path owned by another user', async () => {
    const { service, storage, assetRepository } = createService({
      id: 'asset-1',
      path: 'uploads/video.mp4',
      userId: 'owner',
      userType: UserType.User,
    })

    await expect(service.getOrCreateAssetByPath('uploads/video.mp4', 'attacker'))
      .rejects
      .toMatchObject({ response: { code: ResponseCode.AssetNotFound } })
    expect(storage.headObject).not.toHaveBeenCalled()
    expect(assetRepository.upsertByPath).not.toHaveBeenCalled()
  })

  it('returns an existing asset to its owner', async () => {
    const asset = {
      id: 'asset-1',
      path: 'uploads/video.mp4',
      userId: 'owner',
      userType: UserType.User,
      status: AssetStatus.Confirmed,
      type: AssetType.Temp,
    }
    const { service, storage } = createService(asset)

    await expect(service.getOrCreateAssetByPath('uploads/video.mp4', 'owner')).resolves.toBe(asset)
    expect(storage.headObject).not.toHaveBeenCalled()
  })
})

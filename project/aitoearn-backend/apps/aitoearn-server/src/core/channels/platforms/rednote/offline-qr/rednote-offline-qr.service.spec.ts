import { createHash } from 'node:crypto'
import { ResponseCode } from '@yikart/common'
import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlatformStatus } from '../../platforms.interface'
import { RedNoteOfflineQrService } from './rednote-offline-qr.service'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

const axiosPost = vi.mocked(axios.post)

function createService() {
  return new RedNoteOfflineQrService({
    status: PlatformStatus.Available,
    logoUrl: 'https://assets.aitoearn.ai/platforms/rednote.svg',
    appKey: 'app-key',
    appSecret: 'app-secret',
    accessTokenUrl: 'https://edith.xiaohongshu.com/api/sns/v1/ext/access/token',
  })
}

function buildSignature(appKey: string, nonce: string, timestamp: string, secretKey: string) {
  const paramsString = [
    ['appKey', appKey],
    ['nonce', nonce],
    ['timeStamp', timestamp],
  ]
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  return createHash('sha256')
    .update(`${paramsString}${secretKey}`, 'utf8')
    .digest('hex')
}

describe('rednote offline qr service', () => {
  beforeEach(() => {
    axiosPost.mockReset()
    vi.useRealTimers()
  })

  it('exchanges access token and returns xhs share verify config', async () => {
    vi.setSystemTime(new Date('2026-06-05T10:00:00.000Z'))
    axiosPost.mockResolvedValueOnce({
      data: {
        success: true,
        data: { access_token: 'access-token' },
      },
    })

    const result = await createService().createShareConfig('nonce-1')
    const timestamp = new Date('2026-06-05T10:00:00.000Z').getTime().toString()

    expect(axiosPost).toHaveBeenCalledWith(
      'https://edith.xiaohongshu.com/api/sns/v1/ext/access/token',
      {
        app_key: 'app-key',
        nonce: 'nonce-1',
        timestamp,
        signature: buildSignature('app-key', 'nonce-1', timestamp, 'app-secret'),
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      },
    )
    expect(result).toEqual({
      verifyConfig: {
        appKey: 'app-key',
        nonce: 'nonce-1',
        timestamp,
        signature: buildSignature('app-key', 'nonce-1', timestamp, 'access-token'),
      },
    })
  })

  it('throws platform api failure when access token is missing', async () => {
    axiosPost.mockResolvedValueOnce({
      data: {
        success: false,
        msg: 'invalid signature',
      },
    })

    await expect(createService().createShareConfig('nonce-1'))
      .rejects
      .toMatchObject({ code: ResponseCode.ChannelPlatformApiFailed })
  })
})

import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { ApiKeyService } from './api-key.service'

vi.mock('../../config', () => ({
  config: {
    apiKey: {
      prefix: 'ai_',
    },
  },
}))

vi.mock('@yikart/mongodb', () => ({
  ApiKeyRepository: class {},
}))

describe('apiKeyService', () => {
  it('创建 API Key 时使用配置的前缀并保存明文 key 的 hash', async () => {
    const createdAt = new Date('2026-06-12T00:00:00.000Z')
    const apiKeyRepository = {
      create: vi.fn().mockResolvedValue({
        id: 'api-key-1',
        name: 'test key',
        createdAt,
      }),
    }
    const service = new ApiKeyService(apiKeyRepository as any)

    const result = await service.create('user-1', 'test key')

    expect(result.key).toMatch(/^ai_[0-9A-Za-z]{48}$/)
    expect(apiKeyRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'test key',
      keyHash: createHash('sha1').update(result.key).digest('hex'),
    })
    expect(result).toEqual({
      id: 'api-key-1',
      name: 'test key',
      key: result.key,
      createdAt,
    })
  })
})

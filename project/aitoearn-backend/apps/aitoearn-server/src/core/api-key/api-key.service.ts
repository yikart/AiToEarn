import { createHash } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { ApiKeyRepository } from '@yikart/mongodb'
import { customAlphabet } from 'nanoid'

const generateId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 48)

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
  ) {}

  async create(userId: string, name: string) {
    const rawKey = `ak_${generateId()}`
    const keyHash = this.hashKey(rawKey)

    const apiKey = await this.apiKeyRepository.create({
      userId,
      name,
      keyHash,
    })

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      createdAt: apiKey.createdAt,
    }
  }

  async listByUserId(userId: string) {
    return await this.apiKeyRepository.listByUserId(userId)
  }

  async deleteByIdAndUserId(id: string, userId: string): Promise<void> {
    await this.apiKeyRepository.deleteByIdAndUserId(id, userId)
  }

  async validateKey(rawKey: string) {
    const keyHash = this.hashKey(rawKey)
    const apiKey = await this.apiKeyRepository.getByKeyHash(keyHash)

    if (!apiKey) {
      throw new AppException(ResponseCode.ApiKeyInvalid)
    }

    await this.apiKeyRepository.updateLastUsedAt(apiKey.id)

    return apiKey
  }

  private hashKey(rawKey: string): string {
    return createHash('sha1').update(rawKey).digest('hex')
  }
}

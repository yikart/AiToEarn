import * as fs from 'node:fs'
import { Storage } from '@google-cloud/storage'
import { GoogleGenAI } from '@google/genai'
import { Injectable, Logger } from '@nestjs/common'
import { getErrorMessage } from '@yikart/common'
import { Redis } from 'ioredis'
import {
  GeminiErrorAnalysis,
  GeminiErrorType,
  GeminiKeyPairSelection,
  GeminiKeyPairState,
  GeminiKeyStatus,
} from './gemini-key-manager.interface'
import { GeminiConfig, GeminiKeyManagerConfig, GeminiKeyPair } from './gemini.config'

@Injectable()
export class GeminiKeyManagerService {
  private readonly logger = new Logger(GeminiKeyManagerService.name)
  private readonly keyManagerConfig: GeminiKeyManagerConfig
  private readonly keyPairs: GeminiKeyPair[]
  private readonly redisKeyPrefix: string
  private readonly storageClientCache = new Map<string, Storage>()
  private readonly genAiClientCache = new Map<string, GoogleGenAI>()

  constructor(
    private readonly config: GeminiConfig,
    private readonly redis: Redis,
  ) {
    this.keyPairs = config.keyPairs
    this.keyManagerConfig = {
      cooldownSeconds: config.keyManager?.cooldownSeconds ?? 300,
      failureThreshold: config.keyManager?.failureThreshold ?? 3,
      redisKeyPrefix: config.keyManager?.redisKeyPrefix ?? 'gemini:vertex',
    }
    this.redisKeyPrefix = this.keyManagerConfig.redisKeyPrefix
    this.initializeClients()
  }

  private initializeClients(): void {
    for (const pair of this.keyPairs) {
      const keyPairId = pair.projectId

      const storage = new Storage({
        credentials: JSON.parse(fs.readFileSync(pair.keyFile, 'utf-8')),
        ...(this.config.proxyUrl && {
          apiEndpoint: `${this.config.proxyUrl}/https://storage.googleapis.com`,
        }),
      })
      this.storageClientCache.set(keyPairId, storage)

      const genAiClient = new GoogleGenAI({
        vertexai: true,
        project: pair.projectId,
        location: this.config.location,
        googleAuthOptions: {
          apiKey: pair.apiKey,
        },
      })

      if (this.config.proxyUrl) {
        const apiClient = genAiClient['apiClient']
        const autoUrl = apiClient.getBaseUrl()
        apiClient.setBaseUrl(`${this.config.proxyUrl}/${autoUrl}`)
        this.logger.log({ keyPairId, proxyBaseUrl: `${this.config.proxyUrl}/${autoUrl}` }, 'Patched GenAI base URL with proxy')
      }

      this.genAiClientCache.set(keyPairId, genAiClient)

      this.logger.log(
        { keyPairId, bucket: pair.bucket },
        'Initialized Storage and GenAI clients',
      )
    }
  }

  private getStateKey(keyPairId: string): string {
    return `${this.redisKeyPrefix}:state:${keyPairId}`
  }

  private getIndexKey(): string {
    return `${this.redisKeyPrefix}:index`
  }

  private async getKeyPairState(keyPairId: string): Promise<GeminiKeyPairState | null> {
    const data = await this.redis.get(this.getStateKey(keyPairId))
    return data ? JSON.parse(data) : null
  }

  private async setKeyPairState(state: GeminiKeyPairState): Promise<void> {
    await this.redis.set(this.getStateKey(state.keyPairId), JSON.stringify(state))
  }

  private createDefaultState(keyPairId: string): GeminiKeyPairState {
    return {
      keyPairId,
      status: GeminiKeyStatus.Available,
      failureCount: 0,
      totalRequests: 0,
      totalFailures: 0,
      errorCodes: {},
    }
  }

  async selectKeyPair(): Promise<GeminiKeyPairSelection> {
    const now = Date.now()
    const availablePairs: { pair: GeminiKeyPair, state: GeminiKeyPairState }[] = []
    let shortestCooldownPair: { pair: GeminiKeyPair, cooldownUntil: number } | null = null

    for (const pair of this.keyPairs) {
      const keyPairId = pair.projectId
      let state = await this.getKeyPairState(keyPairId)

      if (!state) {
        state = this.createDefaultState(keyPairId)
        await this.setKeyPairState(state)
      }

      if (state.status === GeminiKeyStatus.Disabled) {
        continue
      }

      if (state.status === GeminiKeyStatus.Cooldown && state.cooldownUntil) {
        if (now >= state.cooldownUntil) {
          state.status = GeminiKeyStatus.Available
          state.failureCount = 0
          state.cooldownUntil = undefined
          await this.setKeyPairState(state)
          availablePairs.push({ pair, state })
        }
        else if (!shortestCooldownPair || state.cooldownUntil < shortestCooldownPair.cooldownUntil) {
          shortestCooldownPair = { pair, cooldownUntil: state.cooldownUntil }
        }
      }
      else {
        availablePairs.push({ pair, state })
      }
    }

    if (availablePairs.length === 0) {
      if (shortestCooldownPair) {
        const keyPairId = shortestCooldownPair.pair.projectId
        this.logger.warn(
          { keyPairId },
          'All key pairs in cooldown, using shortest cooldown pair',
        )
        return {
          keyPairId,
          apiKey: shortestCooldownPair.pair.apiKey,
          projectId: shortestCooldownPair.pair.projectId,
          bucket: shortestCooldownPair.pair.bucket,
          storageClient: this.storageClientCache.get(keyPairId)!,
          genAiClient: this.genAiClientCache.get(keyPairId)!,
        }
      }
      throw new Error('No available Vertex AI key pairs')
    }

    const index = await this.redis.incr(this.getIndexKey())
    const selectedIndex = (index - 1) % availablePairs.length
    const selected = availablePairs[selectedIndex]
    const keyPairId = selected.pair.projectId

    return {
      keyPairId,
      apiKey: selected.pair.apiKey,
      projectId: selected.pair.projectId,
      bucket: selected.pair.bucket,
      storageClient: this.storageClientCache.get(keyPairId)!,
      genAiClient: this.genAiClientCache.get(keyPairId)!,
    }
  }

  getStorageClientByKeyPairId(keyPairId: string): Storage | null {
    return this.storageClientCache.get(keyPairId) || null
  }

  getGenAiClientByKeyPairId(keyPairId: string): GoogleGenAI | null {
    return this.genAiClientCache.get(keyPairId) || null
  }

  getBucketByKeyPairId(keyPairId: string): string | null {
    const pair = this.keyPairs.find(p => p.projectId === keyPairId)
    return pair?.bucket || null
  }

  getDefaultKeyPairId(): string {
    return this.keyPairs[0]?.projectId || ''
  }

  async markKeySuccess(keyPairId: string): Promise<void> {
    let state = await this.getKeyPairState(keyPairId)
    if (!state) {
      state = this.createDefaultState(keyPairId)
    }

    state.failureCount = 0
    state.lastSuccessAt = Date.now()
    state.totalRequests++
    if (state.status === GeminiKeyStatus.Cooldown) {
      state.status = GeminiKeyStatus.Available
      state.cooldownUntil = undefined
    }

    await this.setKeyPairState(state)
  }

  private async countAvailableKeyPairs(excludeKeyPairId?: string): Promise<number> {
    const now = Date.now()
    const filteredPairs = this.keyPairs.filter(
      p => !excludeKeyPairId || p.projectId !== excludeKeyPairId,
    )

    if (filteredPairs.length === 0) {
      return 0
    }

    const states = await Promise.all(
      filteredPairs.map(p => this.getKeyPairState(p.projectId)),
    )

    return states.reduce((count, state) => {
      if (!state) {
        return count + 1
      }

      if (state.status === GeminiKeyStatus.Disabled) {
        return count
      }

      if (state.status === GeminiKeyStatus.Cooldown && state.cooldownUntil) {
        return now >= state.cooldownUntil ? count + 1 : count
      }

      return count + 1
    }, 0)
  }

  async markKeyFailed(keyPairId: string, error: unknown): Promise<GeminiErrorAnalysis> {
    const analysis = this.analyzeError(error)
    let state = await this.getKeyPairState(keyPairId)

    if (!state) {
      state = this.createDefaultState(keyPairId)
    }

    state.failureCount++
    state.totalFailures++
    state.totalRequests++
    state.lastFailureAt = Date.now()
    state.errorCodes[analysis.errorType] = (state.errorCodes[analysis.errorType] || 0) + 1

    if (analysis.shouldSwitchKey) {
      state.status = GeminiKeyStatus.Cooldown
      state.cooldownUntil = Date.now() + analysis.cooldownSeconds * 1000

      if (analysis.errorType === GeminiErrorType.Unauthorized || analysis.errorType === GeminiErrorType.Forbidden) {
        this.logger.fatal({ keyPairId, errorType: analysis.errorType }, 'Key pair authentication failed')
        this.logger.fatal(error, 'Key pair authentication failed')
      }
      else {
        this.logger.warn(
          { keyPairId, errorType: analysis.errorType, cooldownSeconds: analysis.cooldownSeconds },
          'Key pair entering cooldown',
        )
      }
    }

    await this.setKeyPairState(state)

    const availableCount = await this.countAvailableKeyPairs(
      analysis.shouldSwitchKey ? keyPairId : undefined,
    )

    return {
      ...analysis,
      hasAlternativeKey: availableCount > 0,
    }
  }

  private analyzeError(error: unknown): Omit<GeminiErrorAnalysis, 'hasAlternativeKey'> {
    const statusCode = this.extractStatusCode(error)
    const errorMessage = getErrorMessage(error)

    if (statusCode === 429 || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      return { errorType: GeminiErrorType.RateLimit, shouldSwitchKey: true, retryable: true, cooldownSeconds: 60 }
    }

    if (statusCode === 403) {
      return { errorType: GeminiErrorType.Forbidden, shouldSwitchKey: true, retryable: true, cooldownSeconds: 3600 }
    }

    if (statusCode === 401) {
      return { errorType: GeminiErrorType.Unauthorized, shouldSwitchKey: true, retryable: true, cooldownSeconds: 86400 }
    }

    return { errorType: GeminiErrorType.Unknown, shouldSwitchKey: false, retryable: false, cooldownSeconds: 0 }
  }

  private extractStatusCode(error: unknown): number | undefined {
    if (error && typeof error === 'object') {
      if ('status' in error)
        return error.status as number
      if ('statusCode' in error)
        return error.statusCode as number
      if ('response' in error && error.response && typeof error.response === 'object' && 'status' in error.response) {
        return error.response.status as number
      }
    }
    return undefined
  }

  async getAllKeyPairStatus(): Promise<GeminiKeyPairState[]> {
    const states: GeminiKeyPairState[] = []
    for (const pair of this.keyPairs) {
      const keyPairId = pair.projectId
      const state = await this.getKeyPairState(keyPairId)
      states.push(state || this.createDefaultState(keyPairId))
    }
    return states
  }

  async resetKeyPairStatus(keyPairId: string): Promise<void> {
    const state = this.createDefaultState(keyPairId)
    await this.setKeyPairState(state)
  }

  async disableKeyPair(keyPairId: string): Promise<void> {
    let state = await this.getKeyPairState(keyPairId)
    if (!state) {
      state = this.createDefaultState(keyPairId)
    }
    state.status = GeminiKeyStatus.Disabled
    await this.setKeyPairState(state)
    this.logger.warn({ keyPairId }, 'Key pair disabled')
  }

  async enableKeyPair(keyPairId: string): Promise<void> {
    let state = await this.getKeyPairState(keyPairId)
    if (!state) {
      state = this.createDefaultState(keyPairId)
    }
    state.status = GeminiKeyStatus.Available
    state.failureCount = 0
    state.cooldownUntil = undefined
    await this.setKeyPairState(state)
    this.logger.log({ keyPairId }, 'Key pair enabled')
  }
}

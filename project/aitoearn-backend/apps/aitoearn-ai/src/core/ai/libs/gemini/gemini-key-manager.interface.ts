import type { Storage } from '@google-cloud/storage'
import type { GoogleGenAI } from '@google/genai'

export enum GeminiKeyStatus {
  Available = 'available',
  Cooldown = 'cooldown',
  Disabled = 'disabled',
}

export interface GeminiKeyPairState {
  keyPairId: string
  status: GeminiKeyStatus
  failureCount: number
  lastFailureAt?: number
  lastSuccessAt?: number
  cooldownUntil?: number
  totalRequests: number
  totalFailures: number
  errorCodes: Record<string, number>
}

export interface GeminiKeyPairSelection {
  keyPairId: string
  apiKey: string
  projectId: string
  bucket: string
  storageClient: Storage
  genAiClient: GoogleGenAI
}

export enum GeminiErrorType {
  RateLimit = 'rate_limit',
  QuotaExceeded = 'quota_exceeded',
  Unauthorized = 'unauthorized',
  Forbidden = 'forbidden',
  InvalidKey = 'invalid_key',
  Unknown = 'unknown',
}

export interface GeminiErrorAnalysis {
  errorType: GeminiErrorType
  shouldSwitchKey: boolean
  retryable: boolean
  cooldownSeconds: number
  hasAlternativeKey: boolean
}

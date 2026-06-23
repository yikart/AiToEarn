import { createHash, randomBytes } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { AccountType, AppException, ResponseCode } from '@yikart/common'
import axios from 'axios'
import { RednoteConfig } from '../rednote.config'

interface RedNoteAccessTokenResponse {
  success?: boolean
  msg?: string
  data?: {
    access_token?: string
  }
}

@Injectable()
export class RedNoteOfflineQrService {
  constructor(private readonly config: RednoteConfig) {}

  async createShareConfig(nonce?: string) {
    const timestamp = Date.now().toString()
    const resolvedNonce = nonce?.trim() || this.generateNonce()
    const accessToken = await this.fetchAccessToken(resolvedNonce, timestamp)

    return {
      verifyConfig: {
        appKey: this.config.appKey,
        nonce: resolvedNonce,
        timestamp,
        signature: this.buildSignature(this.config.appKey, resolvedNonce, timestamp, accessToken),
      },
    }
  }

  private async fetchAccessToken(nonce: string, timestamp: string): Promise<string> {
    const signature = this.buildSignature(
      this.config.appKey,
      nonce,
      timestamp,
      this.config.appSecret,
    )

    try {
      const response = await axios.post<RedNoteAccessTokenResponse>(
        this.config.accessTokenUrl,
        {
          app_key: this.config.appKey,
          nonce,
          timestamp,
          signature,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        },
      )

      const accessToken = response.data?.data?.access_token
      if (!response.data?.success || !accessToken) {
        throw new AppException(ResponseCode.ChannelPlatformApiFailed, {
          platform: AccountType.RedNote,
          reason: response.data?.msg,
        })
      }

      return accessToken
    }
    catch (error) {
      if (error instanceof AppException) {
        throw error
      }
      throw new AppException(ResponseCode.ChannelPlatformApiFailed, {
        platform: AccountType.RedNote,
      })
    }
  }

  private generateNonce(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const bytes = randomBytes(length)
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length]
    }
    return result
  }

  private buildSignature(appKey: string, nonce: string, timestamp: string, secretKey: string): string {
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
}

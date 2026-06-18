import type { AxiosError, AxiosInstance } from 'axios'
import type { GoogleBusinessErrorBody } from './google-business.exception'
import type {
  GoogleBusinessAccount,
  GoogleBusinessLocation,
} from './google-business.interface'
import { Injectable } from '@nestjs/common'
import axios from 'axios'
import { GoogleBusinessConfig } from './google-business.config'
import { GoogleBusinessPlatformException } from './google-business.exception'
import { GoogleBusinessOAuthGrantType } from './google-business.interface'

@Injectable()
export class GoogleBusinessService {
  private readonly http: AxiosInstance
  private readonly accountApiBaseUrl = 'https://mybusinessaccountmanagement.googleapis.com/v1'
  private readonly apiBaseUrl = 'https://mybusinessbusinessinformation.googleapis.com/v1'

  constructor(private readonly cfg: GoogleBusinessConfig) {
    this.http = this.createHttpClient()
  }

  private createHttpClient(): AxiosInstance {
    const http = axios.create()
    http.interceptors.response.use(
      response => response,
      (error: AxiosError<GoogleBusinessErrorBody>) => {
        throw GoogleBusinessPlatformException.fromAxiosError(error)
      },
    )
    return http
  }

  generateAuthUrl(scopes: string[], state: string): string {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      redirect_uri: this.cfg.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
  }> {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      redirect_uri: this.cfg.redirectUri,
      code,
      grant_type: GoogleBusinessOAuthGrantType.AuthorizationCode,
    })

    const response = await this.http.post<{
      access_token: string
      refresh_token?: string
      expires_in?: number
      scope?: string
    }>('https://oauth2.googleapis.com/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const data = response.data
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scope: data.scope,
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken?: string
    expiresAt?: Date
    scope?: string
  }> {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      refresh_token: refreshToken,
      grant_type: GoogleBusinessOAuthGrantType.RefreshToken,
    })

    const response = await this.http.post<{
      access_token: string
      refresh_token?: string
      expires_in?: number
      scope?: string
    }>('https://oauth2.googleapis.com/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })

    const data = response.data
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
      scope: data.scope,
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    await this.http.post('https://oauth2.googleapis.com/revoke', null, {
      params: { token: accessToken },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async getUserInfo(accessToken: string): Promise<{
    platformUid: string
    displayName: string
    avatarUrl?: string
    email?: string
  }> {
    const response = await this.http.get<{
      sub: string
      name: string
      picture?: string
      email?: string
    }>('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    return {
      platformUid: response.data.sub,
      displayName: response.data.name,
      avatarUrl: response.data.picture,
      email: response.data.email,
    }
  }

  async listAccounts(accessToken: string): Promise<GoogleBusinessAccount[]> {
    const accounts: GoogleBusinessAccount[] = []
    let pageToken: string | undefined

    do {
      const response = await this.http.get<{ accounts: GoogleBusinessAccount[], nextPageToken?: string }>(
        `${this.accountApiBaseUrl}/accounts`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: pageToken ? { pageToken } : undefined,
        },
      )
      accounts.push(...(response.data.accounts ?? []))
      pageToken = response.data.nextPageToken
    } while (pageToken)

    return accounts
  }

  async listLocations(
    accessToken: string,
    accountName: string,
  ): Promise<GoogleBusinessLocation[]> {
    const locations: GoogleBusinessLocation[] = []
    let pageToken: string | undefined

    do {
      const response = await this.http.get<{ locations: GoogleBusinessLocation[], nextPageToken?: string }>(
        `${this.apiBaseUrl}/${accountName}/locations`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            readMask: 'name,title,websiteUri,storefrontAddress',
            ...(pageToken && { pageToken }),
          },
        },
      )
      locations.push(...(response.data.locations ?? []))
      pageToken = response.data.nextPageToken
    } while (pageToken)

    return locations
  }
}

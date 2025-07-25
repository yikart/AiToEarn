import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '@/config'
import {
  TwitterFollowingResponse,
  TwitterOAuthCredential,
  TwitterRevokeAccessResponse,
  TwitterUserInfo,
  TwitterUserInfoResponse,
  XChunkedMediaUploadRequest,
  XCreatePostRequest,
  XCreatePostResponse,
  XMediaUploadInitRequest,
  XMediaUploadResponse,
} from './twitter.interfaces'

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name)
  private readonly clientSecret: string
  private readonly clientId: string
  private readonly redirectUri: string
  private readonly apiBaseUrl: string = 'https://api.x.com/2'
  private readonly authUrl: string = 'https://x.com/i/oauth2/authorize'
  private readonly tokenSecret: string
  private readonly oAuthRequestHeader: Record<string, string> = {}

  constructor() {
    this.clientSecret = config.twitter.clientSecret
    this.clientId = config.twitter.clientId
    this.redirectUri = config.twitter.redirectUri
    this.tokenSecret = `${this.tokenSecret}`
    this.oAuthRequestHeader = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64')}`,
    }
  }

  generateAuthorizeURL(
    scopes: string[],
    state: string,
    codeChallenge: string,
  ): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })
    const authorizeURL = new URL(this.authUrl)
    authorizeURL.search = params.toString()
    this.logger.debug(`Generated Twitter auth URL: ${authorizeURL.toString()}`)
    return authorizeURL.toString()
  }

  async getOAuthCredential(
    code: string,
    codeVerifier: string,
  ): Promise<TwitterOAuthCredential> {
    const url = `${this.apiBaseUrl}/oauth2/token`
    const params = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier,
    })

    const config: AxiosRequestConfig = {
      headers: this.oAuthRequestHeader,
    }
    const response: AxiosResponse<TwitterOAuthCredential> = await axios.post(
      url,
      params.toString(),
      config,
    )
    return response.data
  }

  async refreshOAuthCredential(
    refreshToken: string,
  ): Promise<TwitterOAuthCredential> {
    const url = `${this.apiBaseUrl}/oauth2/token`
    const params = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })

    const config: AxiosRequestConfig = {
      headers: this.oAuthRequestHeader,
    }
    const response: AxiosResponse<TwitterOAuthCredential> = await axios.post(
      url,
      params.toString(),
      config,
    )
    return response.data
  }

  async revokeOAuthCredential(
    accessToken: string,
  ): Promise<TwitterRevokeAccessResponse> {
    const url = `${this.apiBaseUrl}/oauth2/revoke`
    const params = new URLSearchParams({
      token: accessToken,
    })
    const config: AxiosRequestConfig = {
      headers: this.oAuthRequestHeader,
    }
    return await axios.post(url, params.toString(), config)
  }

  async getUserInfo(accessToken: string): Promise<TwitterUserInfo> {
    const url = `${this.apiBaseUrl}/users/me`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        'user.fields':
          'id,name,profile_image_url,username,verified,created_at,protected',
      },
    }
    const response: AxiosResponse<TwitterUserInfoResponse> = await axios.get(
      url,
      config,
    )
    return response.data.data
  }

  async followUser(
    accessToken: string,
    xUserId: string,
  ): Promise<TwitterFollowingResponse> {
    const url = `${this.apiBaseUrl}/users/${xUserId}/following`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    const params = new URLSearchParams({
      target_user_id: xUserId,
    })
    const response: AxiosResponse<TwitterFollowingResponse> = await axios.post(
      url,
      params.toString(),
      config,
    )
    return response.data
  }

  async initMediaUpload(accessToken: string, req: XMediaUploadInitRequest): Promise<XMediaUploadResponse> {
    const url = `${this.apiBaseUrl}/media/upload`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: req,
    }
    const response: AxiosResponse<XMediaUploadResponse> = await axios.post(
      url,
      config,
    )
    return response.data
  }

  async chunkedMediaUploadRequest(
    accessToken: string,
    req: XChunkedMediaUploadRequest,
  ): Promise<XMediaUploadResponse> {
    const url = `${this.apiBaseUrl}/media/upload`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: req,
    }
    const response: AxiosResponse<XMediaUploadResponse> = await axios.post(
      url,
      config,
    )
    return response.data
  }

  async finalizeMediaUpload(
    accessToken: string,
    mediaId: string,
  ): Promise<XMediaUploadResponse> {
    const url = `${this.apiBaseUrl}/media/upload/${mediaId}/finalize`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
    const response: AxiosResponse<XMediaUploadResponse> = await axios.post(
      url,
      config,
    )
    return response.data
  }

  async createPost(
    accessToken: string,
    post: XCreatePostRequest,
  ): Promise<XCreatePostResponse> {
    const url = `${this.apiBaseUrl}/tweets`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
    const response: AxiosResponse<XCreatePostResponse> = await axios.post(
      url,
      post,
      config,
    )
    return response.data
  }

  async getPostDetail(
    accessToken: string,
    postId: string,
  ): Promise<XCreatePostResponse> {
    const url = `${this.apiBaseUrl}/tweets/${postId}`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        'tweet.fields': 'created_at,public_metrics',
        'expansions': 'author_id',
        'user.fields': 'id,name,username,profile_image_url,verified',
      },
    }
    const response: AxiosResponse<XCreatePostResponse> = await axios.get(
      url,
      config,
    )
    return response.data
  }
}

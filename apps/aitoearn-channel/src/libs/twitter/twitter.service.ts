import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../config'
import {
  TwitterFollowingResponse,
  TwitterOAuthCredential,
  TwitterRevokeAccessResponse,
  TwitterUserInfo,
  TwitterUserInfoResponse,
  XChunkedMediaUploadRequest,
  XCreatePostRequest,
  XCreatePostResponse,
  XDeletePostResponse,
  XDeleteTweetResponse,
  XLikePostResponse,
  XMediaUploadInitRequest,
  XMediaUploadResponse,
  XPostDetailResponse,
  XRePostResponse,
  XUserTimelineRequest,
  XUserTimelineResponse,
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

  private async request<T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<T> {
    this.logger.debug(
      `Twitter API Request: ${url} with config: ${JSON.stringify(config)}`,
    )
    try {
      const response: AxiosResponse<T> = await axios(url, config)
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(
          `Twitter API request failed: ${url}, status: ${error.response.status}, data: ${JSON.stringify(error.response.data)}`,
        )
        throw new Error(
          `Twitter API request failed: ${error.response.data.error.message}`,
        )
      }
      this.logger.error(`Twitter API request failed: ${url}`, error)
      throw new Error(`Twitter API request failed: ${error.message}`)
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
      method: 'POST',
      headers: this.oAuthRequestHeader,
      data: params.toString(),
    }
    return await this.request<TwitterOAuthCredential>(url, config)
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
      method: 'POST',
      headers: this.oAuthRequestHeader,
      data: params.toString(),
    }
    return await this.request<TwitterOAuthCredential>(url, config)
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
      method: 'POST',
      data: params.toString(),
    }
    return await this.request<TwitterRevokeAccessResponse>(url, config)
  }

  async getUserInfo(accessToken: string): Promise<TwitterUserInfo> {
    const url = `${this.apiBaseUrl}/users/me`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        'user.fields':
          'id,name,profile_image_url,username,verified,created_at,protected,public_metrics',
      },
    }
    return await this.request<TwitterUserInfoResponse>(url, config).then(
      res => res.data,
    )
  }

  async followUser(
    accessToken: string,
    xUserId: string,
  ): Promise<TwitterFollowingResponse> {
    const url = `${this.apiBaseUrl}/users/${xUserId}/following`
    const params = new URLSearchParams({
      target_user_id: xUserId,
    })
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'POST',
      data: params.toString(),
    }
    return await this.request<TwitterFollowingResponse>(url, config)
  }

  async initMediaUpload(
    accessToken: string,
    req: XMediaUploadInitRequest,
  ): Promise<XMediaUploadResponse> {
    const url = `${this.apiBaseUrl}/media/upload/initialize`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: req,
    }
    return await this.request<XMediaUploadResponse>(url, config)
  }

  async chunkedMediaUploadRequest(
    accessToken: string,
    req: XChunkedMediaUploadRequest,
  ): Promise<XMediaUploadResponse> {
    const url = `${this.apiBaseUrl}/media/upload/${req.media_id}/append`
    const formData = new FormData()
    formData.append('media', new Blob([req.media]))
    formData.append('segment_index', req.segment_index.toString())
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    }
    return await this.request<XMediaUploadResponse>(url, config)
  }

  async finalizeMediaUpload(
    accessToken: string,
    mediaId: string,
  ): Promise<XMediaUploadResponse> {
    const url = `${this.apiBaseUrl}/media/upload/${mediaId}/finalize`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    return await this.request<XMediaUploadResponse>(url, config)
  }

  async createPost(
    accessToken: string,
    tweet: XCreatePostRequest,
  ): Promise<XCreatePostResponse> {
    const url = `${this.apiBaseUrl}/tweets`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: tweet,
    }
    return await this.request<XCreatePostResponse>(url, config)
  }

  async deletePost(
    accessToken: string,
    postId: string,
  ): Promise<XDeletePostResponse> {
    const url = `${this.apiBaseUrl}/tweets/${postId}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    return await this.request<XDeletePostResponse>(url, config)
  }

  async getUserPosts(
    userId: string,
    accessToken: string,
    query: XUserTimelineRequest,
  ): Promise<XUserTimelineResponse> {
    const url = `${this.apiBaseUrl}/users/${userId}/tweets`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        ...query,
        'tweet.fields':
          'id,text,author_id,created_at,public_metrics,attachments',
      },
    }
    return await this.request<XUserTimelineResponse>(url, config)
  }

  async getUserTimeline(
    userId: string,
    accessToken: string,
    query: XUserTimelineRequest,
  ): Promise<XUserTimelineResponse> {
    const url = `${this.apiBaseUrl}/users/${userId}/timelines/reverse_chronological`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        ...query,
        'tweet.fields':
          'id,text,author_id,created_at,public_metrics,attachments',
      },
    }
    return await this.request<XUserTimelineResponse>(url, config)
  }

  async getPostDetail(
    accessToken: string,
    postId: string,
  ): Promise<XPostDetailResponse> {
    const url = `${this.apiBaseUrl}/tweets/${postId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        'tweet.fields': 'created_at,public_metrics',
        'expansions': 'author_id',
        'user.fields': 'id,name,username,profile_image_url,verified',
      },
    }
    return await this.request<XPostDetailResponse>(url, config)
  }

  async getMediaStatus(
    accessToken: string,
    mediaId: string,
  ): Promise<XMediaUploadResponse> {
    const url = `${this.apiBaseUrl}/media/upload`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        media_id: mediaId,
      },
    }
    return await this.request<XMediaUploadResponse>(url, config)
  }

  async repost(
    userId: string,
    accessToken: string,
    tweetId: string,
  ): Promise<XRePostResponse> {
    const url = `${this.apiBaseUrl}/2/${userId}/retweets`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: { tweet_id: tweetId },
    }
    return await this.request<XRePostResponse>(url, config)
  }

  async unRepost(
    userId: string,
    accessToken: string,
    tweetId: string,
  ): Promise<XRePostResponse> {
    const url = `${this.apiBaseUrl}/2/${userId}/retweets/${tweetId}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    return await this.request<XRePostResponse>(url, config)
  }

  async likePost(
    userId: string,
    accessToken: string,
    tweetId: string,
  ): Promise<XLikePostResponse> {
    const url = `${this.apiBaseUrl}/2/${userId}/likes`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: { tweet_id: tweetId },
    }
    return await this.request<XLikePostResponse>(url, config)
  }

  async unlikePost(
    userId: string,
    accessToken: string,
    tweetId: string,
  ): Promise<XLikePostResponse> {
    const url = `${this.apiBaseUrl}/2/${userId}/likes/${tweetId}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    return await this.request<XLikePostResponse>(url, config)
  }

  async deleteTweet(
    accessToken: string,
    tweetId: string,
  ): Promise<XDeleteTweetResponse> {
    const url = `${this.apiBaseUrl}/2/tweets/${tweetId}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    return await this.request<XDeleteTweetResponse>(url, config)
  }
}

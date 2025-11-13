import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../config'
import { MetaOAuthLongLivedCredential } from '../../core/platforms/meta/meta.interfaces'
import { InstagramOAuth2Config } from './constants'
import { InstagramError } from './instagram.exception'
import {
  ChunkedMediaUploadRequest,
  CreateMediaContainerRequest,
  CreateMediaContainerResponse,
  IGCommentsResponse,
  IGCommonResponse,
  IGPostCommentsRequest,
  InstagramInsightsRequest,
  InstagramInsightsResponse,
  InstagramMediaInsightsRequest,
  InstagramObjectInfo,
  InstagramUserInfoRequest,
  InstagramUserInfoResponse,
  InstagramUserPostRequest,
  InstagramUserPostResponse,
} from './instagram.interfaces'
import { InstagramOperation } from './instagram.operations'

@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name)
  private readonly clientSecret: string = config.oauth.instagram.clientSecret
  private readonly clientId: string = config.oauth.instagram.clientId
  private readonly refreshAccessToken: string = InstagramOAuth2Config.refreshTokenURL
  private readonly apiBaseUrl: string = InstagramOAuth2Config.apiBaseUrl

  private async request<T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
    ctx: { operation: string },
  ): Promise<T> {
    const { operation } = ctx
    this.logger.debug(`[IG:${operation}] request ${url} ${JSON.stringify({ method: config.method, params: config.params, headers: config.headers })}`)
    try {
      const response: AxiosResponse<T> = await axios(url, config)
      this.logger.debug(`[IG:${operation}] response ${url} status=${response.status} data=${JSON.stringify(response.data)}`)
      return response.data
    }
    catch (error: unknown) {
      const err = InstagramError.buildFromError(
        error,
        operation,
      )
      this.logger.error(`[IG:${operation}] error ${url} message=${err.message} status=${err.status} rawStatus=${err.rawStatus} rawError=${JSON.stringify(err.rawError)}`)
      throw err
    }
  }

  async refreshOAuthCredential(refresh_token: string) {
    const config: AxiosRequestConfig = {
      method: 'GET',
      params: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'ig_exchange_token',
        access_token: refresh_token,
      },
    }
    return await this.request<MetaOAuthLongLivedCredential>(
      this.refreshAccessToken,
      config,
      { operation: InstagramOperation.REFRESH_OAUTH_CREDENTIAL },
    )
  }

  async createMediaContainer(
    igUserId: string,
    accessToken: string,
    req: CreateMediaContainerRequest,
  ): Promise<CreateMediaContainerResponse> {
    const url = `${this.apiBaseUrl}/v23.0/${igUserId}/media`
    const formData = new FormData()
    Object.keys(req).forEach((key) => {
      if (key !== 'children') {
        formData.append(key, req[key])
      }
    })
    if (req.children) {
      req.children.forEach((child, index) => {
        formData.append(`children[${index}]`, child)
      })
    }

    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: formData,
    }

    return await this.request<CreateMediaContainerResponse>(
      url,
      config,
      { operation: InstagramOperation.CREATE_MEDIA_CONTAINER },
    )
  }

  async chunkedMediaUploadRequest(
    accessToken: string,
    req: ChunkedMediaUploadRequest,
  ): Promise<CreateMediaContainerResponse> {
    const url = req.upload_uri
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'offset': `${req.offset || 0}`,
        'file_size': `${req.file_size}`,
      },
      data: req.file,
    }
    return await this.request<CreateMediaContainerResponse>(
      url,
      config,
      { operation: InstagramOperation.CHUNKED_MEDIA_UPLOAD },
    )
  }

  // https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media#creating
  async publishMediaContainer(
    igUserId: string,
    accessToken: string,
    creationId: string,
  ): Promise<CreateMediaContainerResponse> {
    const url = `${this.apiBaseUrl}/v23.0/${igUserId}/media_publish`
    const formData = new FormData()
    formData.append('creation_id', creationId)
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: formData,
    }
    return await this.request<CreateMediaContainerResponse>(
      url,
      config,
      { operation: InstagramOperation.PUBLISH_MEDIA_CONTAINER },
    )
  }

  async getMetricsForAccount(
    igUserId: string,
    accessToken: string,
    req: InstagramInsightsRequest,
  ) {
    const url = `${this.apiBaseUrl}/${igUserId}/insights`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: req,
    }
    return await this.request<any>(
      url,
      config,
      { operation: InstagramOperation.GET_ACCOUNT_METRICS },
    )
  }

  async getMediaInsights(
    mediaId: string,
    accessToken: string,
    req: InstagramMediaInsightsRequest,
  ) {
    const url = `${this.apiBaseUrl}/${mediaId}/insights`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: req,
    }
    return await this.request<any>(
      url,
      config,
      { operation: InstagramOperation.GET_MEDIA_INSIGHTS },
    )
  }

  async getObjectInfo(
    accessToken: string,
    objectId: string,
    fields?: string,
  ): Promise<InstagramObjectInfo> {
    const url = `${this.apiBaseUrl}/${objectId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    if (fields) {
      config.params = { fields }
    }
    return await this.request<InstagramObjectInfo>(
      url,
      config,
      { operation: InstagramOperation.GET_OBJECT_INFO },
    )
  }

  async getAccountInsights(
    accessToken: string,
    igUserId: string,
    query: InstagramInsightsRequest,
    requestURL?: string,
  ): Promise<InstagramInsightsResponse> {
    const url = requestURL || `${this.apiBaseUrl}/${igUserId}/insights`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    return await this.request<InstagramInsightsResponse>(
      url,
      config,
      { operation: InstagramOperation.GET_ACCOUNT_INSIGHTS },
    )
  }

  async getAccountInfo(
    userId: string,
    accessToken: string,
    query: InstagramUserInfoRequest,
  ): Promise<InstagramUserInfoResponse> {
    const url = `${this.apiBaseUrl}/${userId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    return await this.request<InstagramUserInfoResponse>(
      url,
      config,
      { operation: InstagramOperation.GET_ACCOUNT_INFO },
    )
  }

  async getUserProfile(
    accessToken: string,
    query: InstagramUserInfoRequest,
  ): Promise<InstagramUserInfoResponse> {
    const url = `${this.apiBaseUrl}/me`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    return await this.request<InstagramUserInfoResponse>(
      url,
      config,
      { operation: InstagramOperation.GET_USER_PROFILE },
    )
  }

  async getUserPosts(
    accessToken: string,
    userId: string,
    query: InstagramUserPostRequest,
  ): Promise<InstagramUserPostResponse> {
    const url = `${this.apiBaseUrl}/${userId}/media`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    return await this.request<InstagramUserPostResponse>(
      url,
      config,
      { operation: InstagramOperation.GET_USER_POSTS },
    )
  }

  async fetchPostComments(
    accessToken: string,
    postId: string,
    query: IGPostCommentsRequest,
  ): Promise<IGCommentsResponse> {
    const url = `${this.apiBaseUrl}/${postId}/comments`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    return await this.request<IGCommentsResponse>(
      url,
      config,
      { operation: InstagramOperation.FETCH_POST_COMMENTS },
    )
  }

  async fetchCommentReplies(
    accessToken: string,
    commentId: string,
    query: IGPostCommentsRequest,
  ): Promise<IGCommentsResponse> {
    const url = `${this.apiBaseUrl}/${commentId}/replies`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    return await this.request<IGCommentsResponse>(
      url,
      config,
      { operation: InstagramOperation.FETCH_COMMENT_REPLIES },
    )
  }

  async publishComment(
    accessToken: string,
    postId: string,
    message: string,
  ): Promise<IGCommonResponse> {
    const url = `${this.apiBaseUrl}/${postId}/comments`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: { message },
    }
    return await this.request<IGCommonResponse>(
      url,
      config,
      { operation: InstagramOperation.PUBLISH_COMMENT },
    )
  }

  async publishSubComment(
    accessToken: string,
    commentId: string,
    message: string,
  ): Promise<IGCommonResponse> {
    const url = `${this.apiBaseUrl}/${commentId}/replies`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: { message },
    }
    return await this.request<IGCommonResponse>(
      url,
      config,
      { operation: InstagramOperation.PUBLISH_SUB_COMMENT },
    )
  }
}

import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { MetaOAuthLongLivedCredential } from '../../core/platforms/meta/meta.interfaces'
import { ThreadsOAuth2Config } from './constants'
import { ThreadsError } from './threads.exception'
import {
  publicProfileResponse,
  ThreadsContainerRequest,
  ThreadsDeletePostResponse,
  ThreadsInsightsRequest,
  ThreadsInsightsResponse,
  ThreadsObjectCommentsRequest,
  ThreadsObjectCommentsResponse,
  ThreadsObjectInfo,
  ThreadsPostItem,
  ThreadsPostResponse,
  ThreadsPostsRequest,
  ThreadsPostsResponse,
  ThreadsSearchLocationRequest,
  ThreadsSearchLocationResponse,
} from './threads.interfaces'

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name)
  private readonly longLivedAccessTokenURL: string
    = ThreadsOAuth2Config.longLivedAccessTokenURL

  private readonly apiBaseUrl: string = ThreadsOAuth2Config.apiBaseUrl

  private async request<T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
    options: { operation?: string } = {},
  ): Promise<T> {
    const operation = options.operation || 'threads request'
    this.logger.debug(
      `[THREADS:${operation}] Request -> ${url} ${config.method || 'GET'} ${config.params ? `params=${JSON.stringify(config.params)}` : ''}`,
    )
    try {
      const response: AxiosResponse<T> = await axios(url, config)
      this.logger.debug(
        `[THREADS:${operation}] Response <- ${url} status=${response.status} data=${JSON.stringify(response.data)}`,
      )
      return response.data
    }
    catch (error) {
      const err = ThreadsError.buildFromError(error, operation)
      this.logger.error(
        `[THREADS:${operation}] Error !! ${url} message=${err.message} status=${err.status} rawError=${JSON.stringify(err.rawError)}`,
      )
      throw err
    }
  }

  async refreshOAuthCredential(refresh_token: string) {
    const config: AxiosRequestConfig = {
      method: 'GET',
      params: {
        grant_type: 'th_refresh_token',
        access_token: refresh_token,
      },
    }
    return await this.request<MetaOAuthLongLivedCredential>(
      this.longLivedAccessTokenURL,
      config,
      { operation: 'refreshOAuthCredential' },
    )
  }

  async createItemContainer(
    threadUserId: string,
    accessToken: string,
    req: ThreadsContainerRequest,
  ): Promise<ThreadsPostResponse> {
    const url = `${this.apiBaseUrl}${threadUserId}/threads`
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

    return await this.request<ThreadsPostResponse>(url, config, { operation: 'createItemContainer' })
  }

  async publishPost(
    threadUserId: string,
    accessToken: string,
    creationId: string,
  ): Promise<ThreadsPostResponse> {
    const url = `${this.apiBaseUrl}${threadUserId}/threads_publish?creation_id=${creationId}`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    return await this.request<ThreadsPostResponse>(url, config, { operation: 'publishPost' })
  }

  async getObjectInfo(
    accessToken: string,
    objectId: string,
    fields?: string,
  ): Promise<ThreadsObjectInfo> {
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
    return await this.request<ThreadsObjectInfo>(url, config, { operation: 'getObjectInfo' })
  }

  async getAccountInsights(
    threadsUserId: string,
    accessToken: string,
    query: ThreadsInsightsRequest,
  ): Promise<ThreadsInsightsResponse> {
    const url = `${this.apiBaseUrl}${threadsUserId}/threads_insights`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    return await this.request<ThreadsInsightsResponse>(url, config, { operation: 'getAccountInsights' })
  }

  async getPublicProfile(
    accessToken: string,
    username: string,
  ): Promise<publicProfileResponse> {
    const url = `${this.apiBaseUrl}public_profile`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: { username },
    }
    return await this.request<publicProfileResponse>(url, config, { operation: 'getPublicProfile' })
  }

  async getMediaInsights(
    mediaId: string,
    accessToken: string,
    query: ThreadsInsightsRequest,
  ): Promise<ThreadsInsightsResponse> {
    const url = `${this.apiBaseUrl}${mediaId}/insights`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    return await this.request<ThreadsInsightsResponse>(url, config, { operation: 'getMediaInsights' })
  }

  async getAccountAllPosts(
    threadUserId: string,
    accessToken: string,
    query: ThreadsPostsRequest,
  ): Promise<ThreadsPostsResponse> {
    const url = `${this.apiBaseUrl}${threadUserId}/threads`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    return await this.request<ThreadsPostsResponse>(url, config, { operation: 'getAccountAllPosts' })
  }

  async getPostDetail(
    accessToken: string,
    postId: string,
    query: ThreadsPostsRequest,
  ): Promise<ThreadsPostItem> {
    const url = `${this.apiBaseUrl}/${postId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    return await this.request<ThreadsPostItem>(url, config, { operation: 'getPostDetail' })
  }

  async fetchObjectComments(
    objectId: string,
    accessToken: string,
    query: ThreadsObjectCommentsRequest,
  ): Promise<ThreadsObjectCommentsResponse> {
    const url = `${this.apiBaseUrl}${objectId}/replies`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    return await this.request<ThreadsObjectCommentsResponse>(url, config, { operation: 'fetchObjectComments' })
  }

  async searchLocations(
    accessToken: string,
    query: ThreadsSearchLocationRequest,
  ): Promise<ThreadsSearchLocationResponse> {
    const url = `${this.apiBaseUrl}location_search`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q: query.query,
      },
    }
    return await this.request<ThreadsSearchLocationResponse>(url, config, { operation: 'searchLocations' })
  }

  async deletePost(
    postId: string,
    accessToken: string,
  ): Promise<ThreadsDeletePostResponse> {
    const url = `${this.apiBaseUrl}/${postId}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    return await this.request<ThreadsDeletePostResponse>(url, config, { operation: 'deletePost' })
  }
}

import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { MetaOAuthLongLivedCredential } from '../../core/plat/meta/meta.interfaces'
import { ThreadsOAuth2Config } from './constants'
import {
  publicProfileResponse,
  ThreadsContainerRequest,
  ThreadsInsightsRequest,
  ThreadsInsightsResponse,
  ThreadsObjectCommentsRequest,
  ThreadsObjectCommentsResponse,
  ThreadsObjectInfo,
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
  ): Promise<T> {
    this.logger.debug(
      `Threads API Request: ${url} with config: ${JSON.stringify(config)}`,
    )
    try {
      const response: AxiosResponse<T> = await axios(url, config)
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(
          `Threads API request failed: ${url}, status: ${error.response.status}, data: ${JSON.stringify(error.response.data)}`,
        )
        if (error.response.data?.error) {
          const { error_user_title, message, code, error_subcode } = error.response.data.error
          const errMsg = `Threads API request failed: ${error_user_title || message} status=${error.response.status} code=${code} sub=${error_subcode}`
          throw new Error(errMsg)
        }
        else {
          throw new Error('Threads API request failed: An unknown error occurred')
        }
      }
      this.logger.error(`Threads API request failed: ${url}`, error)
      throw new Error(`Threads API request failed: ${error.message}`)
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

    return await this.request<ThreadsPostResponse>(url, config)
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
    return await this.request<ThreadsPostResponse>(url, config)
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
    return await this.request<ThreadsObjectInfo>(url, config)
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
    return await this.request<ThreadsInsightsResponse>(url, config)
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
    return await this.request<publicProfileResponse>(url, config)
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
    return await this.request<ThreadsInsightsResponse>(url, config)
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
    return await this.request<ThreadsPostsResponse>(url, config)
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
    return await this.request<ThreadsObjectCommentsResponse>(url, config)
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
    return await this.request<ThreadsSearchLocationResponse>(url, config)
  }

  async deletePost(
    postId: string,
    accessToken: string,
  ): Promise<void> {
    const url = `${this.apiBaseUrl}/${postId}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    await this.request<void>(url, config)
  }
}

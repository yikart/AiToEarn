import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { MetaOAuthLongLivedCredential } from '@/core/plat/meta/meta.interfaces'
import { ThreadsOAuth2Config } from './constants'
import {
  publicProfileResponse,
  ThreadsContainerRequest,
  ThreadsInsightsRequest,
  ThreadsInsightsResponse,
  ThreadsObjectInfo,
  ThreadsPostResponse,
} from './threads.interfaces'

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name)
  private readonly longLivedAccessTokenURL: string = ThreadsOAuth2Config.longLivedAccessTokenURL
  private readonly apiBaseUrl: string = ThreadsOAuth2Config.apiBaseUrl

  async refreshOAuthCredential(refresh_token: string) {
    const lParams: Record<string, string> = {
      grant_type: 'th_refresh_token',
      access_token: refresh_token,
    }

    const longLivedAccessTokenReqParams = new URLSearchParams(lParams)
    const llTokenResponse: AxiosResponse<MetaOAuthLongLivedCredential>
      = await axios.get(this.longLivedAccessTokenURL, {
        params: longLivedAccessTokenReqParams,
      })
    return llTokenResponse.data
  }

  async createItemContainer(
    threadUserId: string,
    accessToken: string,
    req: ThreadsContainerRequest,
  ): Promise<ThreadsPostResponse> {
    const url = `${this.apiBaseUrl}${threadUserId}/threads`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    const formData = new FormData()
    Object.keys(req).forEach((key) => {
      if (key !== 'children') {
        formData.append(key, req[key]);
      }
    });
    if (req.children) {
      req.children.forEach((child, index) => {
        formData.append(`children[${index}]`, child);
      });
    }
    const response: AxiosResponse<ThreadsPostResponse> = await axios.post(url, formData, config)
    return response.data
  }

  async publishPost(
    threadUserId: string,
    accessToken: string,
    creationId: string,
  ): Promise<ThreadsPostResponse> {
    const url = `${this.apiBaseUrl}${threadUserId}/threads_publish?creation_id=${creationId}`
    try {
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
      const response: AxiosResponse<any> = await axios.post(url, {}, config)
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error response from Threads API,URI ${url} thread userId ${threadUserId}, token ${accessToken}, ${JSON.stringify(error.response.error)}`, error.stack)
      }
      this.logger.error(`Error publishing post: ${error.message}`, error.stack)
      throw new Error(`Failed to publish post: ${error.message}`)
    }
  }

  async getObjectInfo(
    accessToken: string,
    objectId: string,
    fields?: string,
  ): Promise<ThreadsObjectInfo> {
    const url = `${this.apiBaseUrl}/${objectId}`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    if (fields) {
      config.params = { fields }
    }
    const response: AxiosResponse<ThreadsObjectInfo> = await axios.get(
      url,
      config,
    )
    return response.data
  }

  async getAccountInsights(
    threadsUserId: string,
    accessToken: string,
    query: ThreadsInsightsRequest,
  ): Promise<ThreadsInsightsResponse> {
    const url = `${this.apiBaseUrl}${threadsUserId}/threads_insights`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    const response: AxiosResponse<ThreadsInsightsResponse> = await axios.get(url, config)
    return response.data
  }

  async getPublicProfile(
    accessToken: string,
    username: string,
  ): Promise<publicProfileResponse> {
    const url = `${this.apiBaseUrl}public_profile`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: { username },
    }
    const response: AxiosResponse<any> = await axios.get(url, config)
    return response.data
  }

  async getMediaInsights(
    mediaId: string,
    accessToken: string,
    query: ThreadsInsightsRequest,
  ): Promise<ThreadsInsightsResponse> {
    const url = `${this.apiBaseUrl}${mediaId}/threads_insights`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    const response: AxiosResponse<ThreadsInsightsResponse> = await axios.get(url, config)
    return response.data
  }

  async getAccountAllPosts(
    threadUserId: string,
    accessToken: string,
    reqURL?: string,
  ): Promise<ThreadsPostResponse> {
    const url = reqURL || `${this.apiBaseUrl}${threadUserId}/threads`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    const response: AxiosResponse<ThreadsPostResponse> = await axios.get(url, config)
    return response.data
  }
}

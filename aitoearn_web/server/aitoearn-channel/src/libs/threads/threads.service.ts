import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '@/config'
import { MetaOAuthLongLivedCredential } from '@/core/plat/meta/meta.interfaces'
import { ThreadsAccountInsightsRequest, ThreadsAccountInsightsResponse, ThreadsContainerRequest, ThreadsObjectInfo, ThreadsPostResponse } from './threads.interfaces'

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name)
  private readonly longLivedAccessTokenURL: string = config.meta.threads.longLivedAccessTokenURL
  private readonly apiBaseUrl: string = config.meta.threads.apiBaseUrl

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
    igUserId: string,
    accessToken: string,
    req: ThreadsContainerRequest,
  ): Promise<ThreadsPostResponse> {
    const url = `${this.apiBaseUrl}${igUserId}/threads`
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
    igUserId: string,
    accessToken: string,
    creationId: string,
  ): Promise<ThreadsPostResponse> {
    try {
      const url = `${this.apiBaseUrl}${igUserId}/threads_publish`
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
      const formData = new FormData()
      formData.append('creation_id', creationId)
      const response: AxiosResponse<any> = await axios.post(url, formData, config)
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error response from Threads API: ${JSON.stringify(error.response.data)}`, error.stack)
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
    query: ThreadsAccountInsightsRequest,
  ): Promise<ThreadsAccountInsightsResponse> {
    const url = `${this.apiBaseUrl}${threadsUserId}/threads_insights`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: query,
    }
    const response: AxiosResponse<ThreadsAccountInsightsResponse> = await axios.get(url, config)
    return response.data
  }
}

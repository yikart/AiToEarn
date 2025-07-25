import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '@/config'
import { MetaOAuthLongLivedCredential } from '@/core/plat/meta/meta.interfaces'
import {
  ChunkedFileUploadRequest,
  ChunkedFileUploadResponse,
  FacebookInitialUploadRequest,
  FacebookInitialUploadResponse,
  FacebookInsightsRequest,
  FacebookInsightsResponse,
  FacebookObjectInfo,
  FacebookPageDetailRequest,
  FacebookPageDetailResponse,
  finalizeUploadRequest,
  finalizeUploadResponse,
  PageAccessTokenResponse,
  PublishMediaPostResponse,
  PublishUploadedVideoPostRequest,
  publishUploadedVideoPostResponse,
  PublishVideoForPageRequest,
  PublishVideoForPageResponse,
  UploadPhotoResponse,
} from './facebook.interfaces'

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name)
  private readonly appId: string
  private readonly clientSecret: string = config.meta.facebook.clientSecret
  private readonly clientId: string = config.meta.facebook.clientId
  private readonly longLivedAccessTokenURL: string = config.meta.facebook.longLivedAccessTokenURL

  private readonly apiHost: string = 'https://graph.facebook.com/'
  private readonly apiBaseUrl: string = 'https://graph.facebook.com/v23.0'

  constructor() {
    this.appId = config.meta.facebook.appId
  }

  async refreshOAuthCredential(refresh_token: string) {
    const lParams: Record<string, string> = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'fb_exchange_token',
      fb_exchange_token: refresh_token,
    }

    const longLivedAccessTokenReqParams = new URLSearchParams(lParams)
    const llTokenResponse: AxiosResponse<MetaOAuthLongLivedCredential>
      = await axios.get(this.longLivedAccessTokenURL, {
        params: longLivedAccessTokenReqParams,
      })
    return llTokenResponse.data
  }

  async initMediaUpload(pageId: string, pageAccessToken: string, req: FacebookInitialUploadRequest): Promise<FacebookInitialUploadResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/videos`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    const formData = new FormData()
    formData.append('upload_phase', req.upload_phase)
    formData.append('file_size', req.file_size.toString())
    formData.append('published', req.published.toString())
    const response: AxiosResponse<FacebookInitialUploadResponse> = await axios.post(
      url,
      formData,
      config,
    )
    return response.data
  }

  async getPageAccessToken(accessToken: string): Promise<PageAccessTokenResponse> {
    const url = `${this.apiBaseUrl}/me/accounts`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    const response: AxiosResponse<PageAccessTokenResponse> = await axios.get(
      url,
      config,
    )
    return response.data
  }

  async chunkedMediaUploadRequest(
    pageId: string,
    pageAccessToken: string,
    req: ChunkedFileUploadRequest,
  ): Promise<ChunkedFileUploadResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/videos`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    const formData = new FormData()
    formData.append('video_file_chunk', new Blob([req.video_file_chunk]))
    formData.append('upload_phase', req.upload_phase)
    formData.append('upload_session_id', req.upload_session_id)
    formData.append('start_offset', req.start_offset.toString())
    formData.append('end_offset', req.end_offset.toString())
    formData.append('published', req.published.toString())
    const response: AxiosResponse<ChunkedFileUploadResponse> = await axios.post(
      url,
      formData,
      config,
    )
    return response.data
  }

  async finalizeMediaUpload(
    pageId: string,
    pageAccessToken: string,
    req: finalizeUploadRequest,
  ): Promise<finalizeUploadResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/videos`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
    }
    const response: AxiosResponse<finalizeUploadResponse> = await axios.post(
      url,
      req,
      config,
    )
    return response.data
  }

  // https://developers.facebook.com/docs/graph-api/reference/page/videos/#Creating
  // https://developers.facebook.com/docs/graph-api/reference/video/
  // immediately publish a video post
  // see https://developers.facebook.com/docs/graph-api/reference/page/videos/?locale=en_US#Creating
  // https://developers.facebook.com/docs/pages-api/posts#publish-a-video
  // https://stackoverflow.com/questions/47284140/facebook-graph-api-publish-post-with-multiple-videos-and-photos
  async publishUploadedVideoPost(
    pageId: string,
    pageAccessToken: string,
    req: PublishUploadedVideoPostRequest,
  ): Promise<publishUploadedVideoPostResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/videos`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    const response: AxiosResponse<publishUploadedVideoPostResponse> = await axios.post(
      url,
      req,
      config,
    )
    if (response.status !== 200) {
      this.logger.error(`Failed to publish video post: ${response.statusText} response: ${JSON.stringify(response.data)}`)
    }
    return response.data
  }

  async publishVideoByImageURL(
    pageId: string,
    pageAccessToken: string,
    req: PublishVideoForPageRequest,
  ): Promise<PublishVideoForPageResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/videos`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: req,
    }
    const response: AxiosResponse<PublishVideoForPageResponse> = await axios.post(
      url,
      config,
    )
    return response.data
  }

  // upload a photo to a page by image URL
  // see https://developers.facebook.com/docs/graph-api/reference/page/photos/#upload
  async uploadPostPhotoByImgURL(
    pageId: string,
    pageAccessToken: string,
    imageURL: string,
  ): Promise<UploadPhotoResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/photos`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        published: false,
        url: imageURL,
      },
    }
    const response: AxiosResponse<UploadPhotoResponse> = await axios.post(
      url,
      config,
    )
    return response.data
  }

  // upload a photo to a page by file
  // see https://developers.facebook.com/docs/graph-api/reference/page/photos/#upload
  // https://stackoverflow.com/questions/50484978/posting-multiple-photo-as-one-batch-to-facebook-page
  // https://community.n8n.io/t/upload-multiple-images-to-facebook-page-in-a-single-post/15389
  async uploadPostPhotoByFile(
    pageId: string,
    pageAccessToken: string,
    file: Buffer,
  ): Promise<UploadPhotoResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/photos`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'multipart/form-data',
      },
      data: {
        published: false,
        source: file,
      },
    }
    const response: AxiosResponse<UploadPhotoResponse> = await axios.postForm(
      url,
      config,
    )
    return response.data
  }

  // immediately publish a single photo post by image URL
  async publishSinglePhotoPostByImgURL(
    pageId: string,
    pageAccessToken: string,
    imageUrl: string,
  ): Promise<PublishMediaPostResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/photos`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        url: imageUrl,
      },
    }
    const response: AxiosResponse<PublishMediaPostResponse> = await axios.post(
      url,
      config,
    )
    return response.data
  }

  // immediately publish multiple photos as a single post
  // first upload the photos to get their IDs, then use those IDs to create a post
  // see https://developers.facebook.com/docs/graph-api/reference/page/photos/#upload
  async publishMultiplePhotoPost(
    pageId: string,
    pageAccessToken: string,
    imageIDList: string[],
  ): Promise<PublishMediaPostResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/photos`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        published: true, // immediately publish
        attached_media: imageIDList.map(id => ({ media_fbid: id })),
      },
    }
    const response: AxiosResponse<PublishMediaPostResponse> = await axios.post(
      url,
      config,
    )
    return response.data
  }

  // https://developers.facebook.com/docs/graph-api/reference/page/photos/#Creating
  // https://developers.facebook.com/docs/graph-api/reference/v23.0/page/feed#publish
  // https://developers.facebook.com/docs/graph-api/reference/page/photos/#upload
  async publishPlainTextPost(
    pageId: string,
    pageAccessToken: string,
    message: string,
  ): Promise<PublishMediaPostResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/feed`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        message,
        published: true, // immediately publish
      },
    }
    const response: AxiosResponse<PublishMediaPostResponse> = await axios.post(
      url,
      config,
    )
    return response.data
  }

  async getObjectInfo(
    pageAccessToken: string,
    objectId: string,
    fields?: string,
  ): Promise<FacebookObjectInfo> {
    const url = `${this.apiBaseUrl}/${objectId}`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    if (fields) {
      config.params = { fields }
    }
    const response: AxiosResponse<FacebookObjectInfo> = await axios.get(
      url,
      config,
    )
    return response.data
  }

  async getPageInsights(
    pageId: string,
    pageAccessToken: string,
    query: FacebookInsightsRequest,
    requestURL?: string,
  ): Promise<FacebookInsightsResponse> {
    try {
      const url = requestURL || `${this.apiBaseUrl}/${pageId}/insights`
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
        },
        params: query,
      }
      const response: AxiosResponse<FacebookInsightsResponse> = await axios.get(
        url,
        config,
      )
      return response.data || null
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error fetching page insights pageId: ${pageId}, req: ${JSON.stringify(query)}: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      throw new Error(`Error fetching page insights, pageId: ${pageId}, req: ${JSON.stringify(query)}`, { cause: error })
    }
  }

  async getPageDetails(
    pageId: string,
    pageAccessToken: string,
    query: FacebookPageDetailRequest,
  ): Promise<FacebookPageDetailResponse> {
    try {
      const url = `${this.apiHost}/${pageId}`
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
        },
        params: query,
      }
      const response: AxiosResponse<FacebookPageDetailResponse> = await axios.get(
        url,
        config,
      )
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error fetching page details pageId: ${pageId}, req: ${JSON.stringify(query)}: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      throw new Error(`Error fetching page details, pageId: ${pageId}, req: ${JSON.stringify(query)}`, { cause: error })
    }
  }
}

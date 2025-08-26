import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '@/config'
import { MetaOAuthLongLivedCredential } from '@/core/plat/meta/meta.interfaces'
import { FacebookOAuth2Config } from './constants'
import {
  ChunkedVideoUploadRequest,
  ChunkedVideoUploadResponse,
  FacebookInitialVideoUploadRequest,
  FacebookInitialVideoUploadResponse,
  FacebookInsightsRequest,
  FacebookInsightsResponse,
  FacebookObjectInfo,
  FacebookPageDetailRequest,
  FacebookPageDetailResponse,
  FacebookPostDetailRequest,
  FacebookPostDetailResponse,
  FacebookPostEdgesRequest,
  FacebookPostEdgesResponse,
  FacebookPublishedPostRequest,
  FacebookPublishedPostResponse,
  FacebookReelRequest,
  FacebookReelResponse,
  FacebookReelUploadRequest,
  FacebookReelUploadResponse,
  finalizeVideoUploadRequest,
  finalizeVideoUploadResponse,
  PageAccessTokenResponse,
  PublishFeedPostRequest,
  PublishMediaPostResponse,
  PublishVideoForPageRequest,
  PublishVideoForPageResponse,
  PublishVideoPostRequest,
  publishVideoPostResponse,
  UploadPhotoResponse,
} from './facebook.interfaces'

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name)
  private readonly clientSecret: string = config.meta.facebook.clientSecret
  private readonly clientId: string = config.meta.facebook.clientId
  private readonly longLivedAccessTokenURL: string = FacebookOAuth2Config.longLivedAccessTokenURL

  private readonly apiHost: string = 'https://graph.facebook.com/'
  private readonly apiBaseUrl: string = 'https://graph.facebook.com/v23.0'

  constructor() { }

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

  async initVideoUpload(pageId: string, pageAccessToken: string, req: FacebookInitialVideoUploadRequest): Promise<FacebookInitialVideoUploadResponse> {
    try {
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
      const response: AxiosResponse<FacebookInitialVideoUploadResponse> = await axios.post(
        url,
        formData,
        config,
      )
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error initializing video upload for pageId: ${pageId}, error: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      throw new Error(`Error initializing video upload for pageId: ${pageId}`, { cause: error })
    }
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

  async chunkedVideoUploadRequest(
    pageId: string,
    pageAccessToken: string,
    req: ChunkedVideoUploadRequest,
  ): Promise<ChunkedVideoUploadResponse> {
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
    const response: AxiosResponse<ChunkedVideoUploadResponse> = await axios.post(
      url,
      formData,
      config,
    )
    return response.data
  }

  async finalizeVideoUpload(
    pageId: string,
    pageAccessToken: string,
    req: finalizeVideoUploadRequest,
  ): Promise<finalizeVideoUploadResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/videos`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
    }
    const response: AxiosResponse<finalizeVideoUploadResponse> = await axios.post(
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
  async publishVideoPost(
    pageId: string,
    pageAccessToken: string,
    req: PublishVideoPostRequest,
  ): Promise<publishVideoPostResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/videos`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    const response: AxiosResponse<publishVideoPostResponse> = await axios.post(
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
  async uploadPhotoPostByImgURL(
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
    file: Blob,
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
    const formData = new FormData()
    formData.append('published', 'false')
    formData.append('source', file) // assuming JPEG, adjust as needed
    const response: AxiosResponse<UploadPhotoResponse> = await axios.postForm(
      url,
      formData,
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
    caption?: string,
  ): Promise<PublishMediaPostResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/feed`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
    }
    try {
      this.logger.log(`Publishing multiple photo post for pageId: ${pageId}, imageIDList: ${JSON.stringify(imageIDList)}, caption: ${caption}`)
      // formData.append('attached_media', JSON.stringify(imageIDList.map(id => ({ media_fbid: id }))))
      // if (caption) {
      //   formData.append('caption', caption)
      // }
      const data = {
        attached_media: imageIDList.map(id => ({ media_fbid: id })),
        message: caption || '',
        published: true,
      }
      const response: AxiosResponse<PublishMediaPostResponse> = await axios.post(
        url,
        data,
        config,
      )
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Failed to publish multiple photo post: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      this.logger.error(`Failed to publish multiple photo post: ${error.message}`)
      throw new Error(`Failed to publish multiple photo post: ${error.message}`, { cause: error })
    }
  }

  // https://developers.facebook.com/docs/graph-api/reference/page/photos/#Creating
  // https://developers.facebook.com/docs/graph-api/reference/v23.0/page/feed#publish
  // https://developers.facebook.com/docs/graph-api/reference/page/photos/#upload
  async publishFeedPost(
    pageId: string,
    pageAccessToken: string,
    req: PublishFeedPostRequest,
  ): Promise<PublishMediaPostResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/feed`
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
    }
    const response: AxiosResponse<PublishMediaPostResponse> = await axios.post(
      url,
      req,
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

  async getPagePublishedPosts(
    pageId: string,
    pageAccessToken: string,
    query: FacebookPublishedPostRequest,
  ): Promise<FacebookPublishedPostResponse> {
    try {
      const url = `${this.apiBaseUrl}/${pageId}/published_posts`
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
        },
        params: query,
      }
      const response: AxiosResponse<FacebookPublishedPostResponse> = await axios.get(
        url,
        config,
      )
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error fetching published posts pageId: ${pageId}, req: ${JSON.stringify(query)}: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      throw new Error(`Error fetching published posts, pageId: ${pageId}, req: ${JSON.stringify(query)}`, { cause: error })
    }
  }

  async getPagePostDetails(
    postId: string,
    pageAccessToken: string,
    query: FacebookPostDetailRequest,
  ): Promise<FacebookPostDetailResponse> {
    try {
      const url = `${this.apiBaseUrl}/${postId}`
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
        },
        params: query,
      }
      const response: AxiosResponse<FacebookPostDetailResponse> = await axios.get(
        url,
        config,
      )
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error fetching post details for post ${postId} on page ${postId}: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      throw new Error(`Error fetching post details for post ${postId} on page ${postId}`, { cause: error })
    }
  }

  async getPostComments(
    postId: string,
    pageAccessToken: string,
    query: FacebookPostEdgesRequest,
  ): Promise<FacebookPostEdgesResponse | null> {
    try {
      const url = `${this.apiBaseUrl}/${postId}/comments`
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
        },
        params: query,
      }
      const response: AxiosResponse<FacebookPostEdgesResponse> = await axios.get(
        url,
        config,
      )
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error fetching comments for post ${postId}: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      throw new Error(`Error fetching comments for post ${postId}`, { cause: error })
    }
  }

  async getPostReactions(
    postId: string,
    pageAccessToken: string,
    query: FacebookPostEdgesRequest,
  ): Promise<FacebookPostEdgesResponse | null> {
    try {
      const url = `${this.apiBaseUrl}/${postId}/reactions`
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
        },
        params: query,
      }
      const response: AxiosResponse<FacebookPostEdgesResponse> = await axios.get(
        url,
        config,
      )
      return response.data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error fetching reactions for post ${postId}: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      throw new Error(`Error fetching reactions for post ${postId}`, { cause: error })
    }
  }

  // get insights for a specific object (like a post or page)
  // see https://developers.facebook.com/docs/graph-api/reference/post/insights/
  // post views and likes query: metric=post_reactions_like_total,post_video_views&period=lifetime
  async getFacebookObjectInsights(
    objectId: string,
    pageAccessToken: string,
    query: FacebookInsightsRequest,
    requestURL?: string,
  ): Promise<FacebookInsightsResponse> {
    try {
      const url = requestURL || `${this.apiBaseUrl}/${objectId}/insights`
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
        this.logger.error(`Error fetching page insights pageId: ${objectId}, req: ${JSON.stringify(query)}: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      throw new Error(`Error fetching page insights, objectId: ${objectId}, req: ${JSON.stringify(query)}`, { cause: error })
    }
  }

  async initReelUpload(
    pageId: string,
    pageAccessToken: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/video_reels`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    const formData = new FormData()
    formData.append('upload_phase', req.upload_phase)
    const response: AxiosResponse<FacebookReelResponse> = await axios.post(
      url,
      formData,
      config,
    )
    return response.data
  }

  async uploadReel(
    pageAccessToken: string,
    uploadURL: string,
    req: FacebookReelUploadRequest,
  ): Promise<FacebookReelUploadResponse> {
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-type': 'application/octet-stream',
        'offset': req.offset.toString(),
        'file_size': req.file_size.toString(),
      },
    }
    this.logger.log(`Authorization: Bearer ${pageAccessToken}`)
    this.logger.log(`Uploading reel with offset: ${req.offset}, file_size: ${req.file_size}`)
    this.logger.log(`Upload URL: ${uploadURL}`)
    this.logger.log(`file size: ${req.file.length}`)
    try {
      const response: AxiosResponse<FacebookReelUploadResponse> = await axios.post(
        uploadURL,
        req.file,
        config,
      )
      const data = response.data
      this.logger.log(`Reel upload response: ${JSON.stringify(data)}`)
      return data
    }
    catch (error) {
      if (error.response) {
        this.logger.error(`Error uploading reel: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
      }
      this.logger.error(`Error uploading reel: ${error.message}`)
      throw new Error(`Error uploading reel: ${error.message}`, { cause: error })
    }
  }

  async publishReelPost(
    pageId: string,
    pageAccessToken: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/video_reels`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    const response: AxiosResponse<FacebookReelResponse> = await axios.post(
      url,
      req,
      config,
    )
    return response.data
  }

  async initVideoStoryUpload(
    pageId: string,
    pageAccessToken: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/video_stories`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    const formData = new FormData()
    formData.append('upload_phase', req.upload_phase)
    const response: AxiosResponse<FacebookReelResponse> = await axios.post(
      url,
      formData,
      config,
    )
    return response.data
  }

  async uploadVideoStory(
    pageAccessToken: string,
    uploadURL: string,
    req: FacebookReelUploadRequest,
  ): Promise<FacebookReelUploadResponse> {
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-type': 'application/octet-stream',
        'offset': req.offset.toString(),
        'file_size': req.file_size.toString(),
      },
    }
    const response: AxiosResponse<FacebookReelUploadResponse> = await axios.post(
      uploadURL,
      req.file,
      config,
    )
    return response.data
  }

  async publishVideoStoryPost(
    pageId: string,
    pageAccessToken: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/video_stories`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    const response: AxiosResponse<FacebookReelResponse> = await axios.post(
      url,
      req,
      config,
    )
    return response.data
  }

  async publishPhotoStoryPost(
    pageId: string,
    pageAccessToken: string,
    photo_id: string,
  ): Promise<FacebookReelResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/photo_stories`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    const response: AxiosResponse<FacebookReelResponse> = await axios.post(
      url,
      {
        photo_id,
      },
      config,
    )
    return response.data
  }
}

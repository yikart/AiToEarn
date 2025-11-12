import { Injectable, Logger } from '@nestjs/common'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { config } from '../../config'
import { MetaOAuthLongLivedCredential } from '../../core/plat/meta/meta.interfaces'
import { FacebookOAuth2Config } from './constants'
import { FacebookApiException, normalizeFacebookError } from './facebook-api.exception'
import {
  ChunkedVideoUploadRequest,
  ChunkedVideoUploadResponse,
  FacebookInitialVideoUploadRequest,
  FacebookInitialVideoUploadResponse,
  FacebookInsightsRequest,
  FacebookInsightsResponse,
  FacebookLikeResponse,
  FacebookObjectInfo,
  FacebookPageDetailRequest,
  FacebookPageDetailResponse,
  FacebookPagePostRequest,
  FacebookPostAttachmentsResponse,
  FacebookPostCommentsRequest,
  FacebookPostCommentsResponse,
  FacebookPostDetail,
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
  FacebookSearchPagesRequest,
  FacebookSearchPagesResponse,
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
import { FacebookOperation } from './facebook.operations'

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name)
  private readonly clientSecret: string = config.oauth.facebook.clientSecret
  private readonly clientId: string = config.oauth.facebook.clientId
  private readonly longLivedAccessTokenURL: string = FacebookOAuth2Config.longLivedAccessTokenURL

  private readonly apiHost: string = 'https://graph.facebook.com/'
  private readonly apiBaseUrl: string = 'https://graph.facebook.com/v23.0'

  constructor() { }

  private async request<T = unknown>(
    url: string,
    config: AxiosRequestConfig = {},
    options: { operation?: string } = {},
  ): Promise<T> {
    const operation = options.operation || 'facebook request'
    this.logger.debug(`[FB:${operation}] Request -> ${url} ${config.method || 'GET'} ${config.params ? `params=${JSON.stringify(config.params)}` : ''}`)
    try {
      const response: AxiosResponse<T> = await axios(url, config)
      this.logger.debug(`[FB:${operation}] Response <- ${url} status=${response.status} data=${JSON.stringify(response.data)}`)
      return response.data
    }
    catch (error: unknown) {
      const normalized = normalizeFacebookError(error)
      const status = normalized.status
      const code = normalized.raw?.code
      const message = normalized.raw?.message || (error as Error)?.message
      this.logger.error(`[FB:${operation}] Failed url=${url} status=${status} code=${code} msg=${message}`)
      throw new FacebookApiException(operation, normalized, { url, method: config.method })
    }
  }

  async refreshOAuthCredential(refresh_token: string) {
    const config: AxiosRequestConfig = {
      method: 'GET',
      params: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'fb_exchange_token',
        fb_exchange_token: refresh_token,
      },
    }

    return await this.request<MetaOAuthLongLivedCredential>(this.longLivedAccessTokenURL, config)
  }

  async initVideoUpload(pageId: string, pageAccessToken: string, req: FacebookInitialVideoUploadRequest): Promise<FacebookInitialVideoUploadResponse> {
    const formData = new FormData()
    formData.append('upload_phase', req.upload_phase)
    formData.append('file_size', req.file_size.toString())
    formData.append('published', req.published.toString())

    const url = `${this.apiBaseUrl}/${pageId}/videos`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      data: formData,
    }
    const response = await this.request<FacebookInitialVideoUploadResponse>(
      url,
      config,
      { operation: FacebookOperation.INIT_VIDEO_UPLOAD },
    )
    return response
  }

  async getPageAccessToken(accessToken: string): Promise<PageAccessTokenResponse> {
    const url = `${this.apiBaseUrl}/me/accounts`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
    return this.request<PageAccessTokenResponse>(url, config, { operation: FacebookOperation.GET_PAGE_ACCESS_TOKEN })
  }

  async chunkedVideoUploadRequest(
    pageId: string,
    pageAccessToken: string,
    req: ChunkedVideoUploadRequest,
  ): Promise<ChunkedVideoUploadResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/videos`
    const formData = new FormData()
    formData.append('video_file_chunk', new Blob([req.video_file_chunk]))
    formData.append('upload_phase', req.upload_phase)
    formData.append('upload_session_id', req.upload_session_id)
    formData.append('start_offset', req.start_offset.toString())
    formData.append('end_offset', req.end_offset.toString())
    formData.append('published', req.published.toString())

    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      data: formData,
    }
    return this.request<ChunkedVideoUploadResponse>(url, config, { operation: FacebookOperation.CHUNKED_VIDEO_UPLOAD })
  }

  async finalizeVideoUpload(
    pageId: string,
    pageAccessToken: string,
    req: finalizeVideoUploadRequest,
  ): Promise<finalizeVideoUploadResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/videos`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: req,
    }
    return this.request<finalizeVideoUploadResponse>(url, config, { operation: FacebookOperation.FINALIZE_VIDEO_UPLOAD })
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
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      data: req,
    }
    return this.request<publishVideoPostResponse>(url, config, { operation: FacebookOperation.PUBLISH_VIDEO_POST })
  }

  async publishVideoByImageURL(
    pageId: string,
    pageAccessToken: string,
    req: PublishVideoForPageRequest,
  ): Promise<PublishVideoForPageResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/videos`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: req,
    }
    return this.request<PublishVideoForPageResponse>(url, config, { operation: FacebookOperation.PUBLISH_VIDEO_BY_IMAGE_URL })
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
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        published: false,
        url: imageURL,
      },
    }
    return this.request<UploadPhotoResponse>(url, config, { operation: FacebookOperation.UPLOAD_PHOTO_BY_URL })
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
    const formData = new FormData()
    formData.append('published', 'false')
    formData.append('source', file) // assuming JPEG, adjust as needed

    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    }

    return this.request<UploadPhotoResponse>(url, config, { operation: FacebookOperation.UPLOAD_PHOTO_BY_FILE })
  }

  // immediately publish a single photo post by image URL
  async publishSinglePhotoPostByImgURL(
    pageId: string,
    pageAccessToken: string,
    imageUrl: string,
  ): Promise<PublishMediaPostResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/photos`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        url: imageUrl,
      },
    }
    return this.request<PublishMediaPostResponse>(url, config, { operation: FacebookOperation.PUBLISH_SINGLE_PHOTO_POST })
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
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        attached_media: imageIDList.map(id => ({ media_fbid: id })),
        message: caption || '',
        published: true,
      },
    }
    return this.request<PublishMediaPostResponse>(url, config, { operation: FacebookOperation.PUBLISH_MULTIPLE_PHOTO_POST })
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
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-Type': 'application/json',
      },
      data: req,
    }
    return this.request<PublishMediaPostResponse>(url, config, { operation: FacebookOperation.PUBLISH_FEED_POST })
  }

  async getObjectInfo(
    pageAccessToken: string,
    objectId: string,
    fields?: string,
  ): Promise<FacebookObjectInfo> {
    const url = `${this.apiBaseUrl}/${objectId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    if (fields) {
      config.params = { fields }
    }
    return this.request<FacebookObjectInfo>(url, config, { operation: FacebookOperation.GET_OBJECT_INFO })
  }

  async getPageInsights(
    pageId: string,
    pageAccessToken: string,
    query: FacebookInsightsRequest,
    requestURL?: string,
  ): Promise<FacebookInsightsResponse> {
    const url = requestURL || `${this.apiBaseUrl}/${pageId}/insights`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      params: query,
    }
    return this.request<FacebookInsightsResponse>(url, config, { operation: FacebookOperation.GET_PAGE_INSIGHTS })
  }

  async getPageDetails(
    pageId: string,
    pageAccessToken: string,
    query: FacebookPageDetailRequest,
  ): Promise<FacebookPageDetailResponse> {
    const url = `${this.apiHost}/${pageId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      params: query,
    }
    return this.request<FacebookPageDetailResponse>(url, config, { operation: FacebookOperation.GET_PAGE_DETAILS })
  }

  async getPagePublishedPosts(
    pageId: string,
    pageAccessToken: string,
    query: FacebookPublishedPostRequest,
  ): Promise<FacebookPublishedPostResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/published_posts`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      params: query,
    }
    return this.request<FacebookPublishedPostResponse>(url, config, { operation: FacebookOperation.GET_PAGE_PUBLISHED_POSTS })
  }

  async getPagePostDetails(
    postId: string,
    pageAccessToken: string,
    query: FacebookPostDetailRequest,
  ): Promise<FacebookPostDetail> {
    const url = `${this.apiBaseUrl}/${postId}`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      params: query,
    }
    return await this.request<FacebookPostDetail>(url, config, { operation: FacebookOperation.GET_PAGE_POST_DETAILS })
  }

  async getPostComments(
    postId: string,
    pageAccessToken: string,
    query: FacebookPostEdgesRequest,
  ): Promise<FacebookPostEdgesResponse> {
    const url = `${this.apiBaseUrl}/${postId}/comments`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      params: query,
    }
    return this.request<FacebookPostEdgesResponse>(url, config, { operation: FacebookOperation.GET_POST_COMMENTS })
  }

  async getPostReactions(
    postId: string,
    pageAccessToken: string,
    query: FacebookPostEdgesRequest,
  ): Promise<FacebookPostEdgesResponse | null> {
    const url = `${this.apiBaseUrl}/${postId}/reactions`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      params: query,
    }
    return this.request<FacebookPostEdgesResponse>(url, config, { operation: FacebookOperation.GET_POST_REACTIONS })
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
    const url = requestURL || `${this.apiBaseUrl}/${objectId}/insights`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      params: query,
    }
    return this.request<FacebookInsightsResponse>(url, config, { operation: FacebookOperation.GET_OBJECT_INSIGHTS })
  }

  async initReelUpload(
    pageId: string,
    pageAccessToken: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/video_reels`

    const formData = new FormData()
    formData.append('upload_phase', req.upload_phase)

    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      data: formData,
    }
    return this.request<FacebookReelResponse>(url, config, { operation: FacebookOperation.INIT_REEL_UPLOAD })
  }

  async uploadReel(
    pageAccessToken: string,
    uploadURL: string,
    req: FacebookReelUploadRequest,
  ): Promise<FacebookReelUploadResponse> {
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-type': 'application/octet-stream',
        'offset': req.offset.toString(),
        'file_size': req.file_size.toString(),
      },
      data: req.file,
    }
    return this.request<FacebookReelUploadResponse>(uploadURL, config, { operation: FacebookOperation.UPLOAD_REEL_CHUNK })
  }

  async publishReelPost(
    pageId: string,
    pageAccessToken: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/video_reels`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      data: req,
    }
    return this.request<FacebookReelResponse>(url, config, { operation: FacebookOperation.PUBLISH_REEL_POST })
  }

  async initVideoStoryUpload(
    pageId: string,
    pageAccessToken: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/video_stories`
    const formData = new FormData()
    formData.append('upload_phase', req.upload_phase)
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      data: formData,
    }
    return this.request<FacebookReelResponse>(url, config, { operation: FacebookOperation.INIT_VIDEO_STORY_UPLOAD })
  }

  async uploadVideoStory(
    pageAccessToken: string,
    uploadURL: string,
    req: FacebookReelUploadRequest,
  ): Promise<FacebookReelUploadResponse> {
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pageAccessToken}`,
        'Content-type': 'application/octet-stream',
        'offset': req.offset.toString(),
        'file_size': req.file_size.toString(),
      },
      data: req.file,
    }
    return this.request<FacebookReelUploadResponse>(uploadURL, config, { operation: FacebookOperation.UPLOAD_VIDEO_STORY_CHUNK })
  }

  async publishVideoStoryPost(
    pageId: string,
    pageAccessToken: string,
    req: FacebookReelRequest,
  ): Promise<FacebookReelResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/video_stories`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      data: req,
    }
    return this.request<FacebookReelResponse>(url, config, { operation: FacebookOperation.PUBLISH_VIDEO_STORY_POST })
  }

  async publishPhotoStoryPost(
    pageId: string,
    pageAccessToken: string,
    photo_id: string,
  ): Promise<FacebookReelResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/photo_stories`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      data: { photo_id },
    }
    return this.request<FacebookReelResponse>(url, config, { operation: FacebookOperation.PUBLISH_PHOTO_STORY_POST })
  }

  async fetchPagePosts(
    pageId: string,
    pageAccessToken: string,
    query: FacebookPagePostRequest,
  ): Promise<FacebookPostDetailResponse> {
    const url = `${this.apiBaseUrl}/${pageId}/feed`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      params: query,
    }
    return await this.request<FacebookPostDetailResponse>(url, config, { operation: FacebookOperation.FETCH_PAGE_POSTS })
  }

  async fetchObjectComments(
    objectId: string,
    pageAccessToken: string,
    query: FacebookPostCommentsRequest,
  ): Promise<FacebookPostCommentsResponse> {
    const url = `${this.apiBaseUrl}/${objectId}/comments`
    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      params: query,
    }
    return this.request<FacebookPostCommentsResponse>(url, config, { operation: FacebookOperation.FETCH_OBJECT_COMMENTS })
  }

  async publishPlaintextComment(
    objectId: string,
    pageAccessToken: string,
    message: string,
  ): Promise<{ id: string }> {
    const url = `${this.apiBaseUrl}/${objectId}/comments`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      data: { message },
    }
    return this.request<{ id: string }>(url, config, { operation: FacebookOperation.PUBLISH_PLAINTEXT_COMMENT })
  }

  async searchPages(
    pageAccessToken: string,
    query: FacebookSearchPagesRequest,
  ): Promise<FacebookSearchPagesResponse> {
    const url = `${this.apiBaseUrl}/pages/search`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
      params: query,
    }
    return this.request<FacebookSearchPagesResponse>(url, config, { operation: FacebookOperation.SEARCH_PAGES })
  }

  async fetchPostAttachments(
    postId: string,
    pageAccessToken: string,
  ): Promise<FacebookPostAttachmentsResponse> {
    const url = `${this.apiBaseUrl}/${postId}/attachments`
    const config: AxiosRequestConfig = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    return this.request<FacebookPostAttachmentsResponse>(url, config, { operation: FacebookOperation.FETCH_POST_ATTACHMENT })
  }

  async deletePost(
    postId: string,
    pageAccessToken: string,
  ): Promise<void> {
    const url = `${this.apiBaseUrl}/${postId}`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    await this.request<void>(url, config, { operation: FacebookOperation.DELETE_POST })
  }

  async likeObject(
    objectId: string,
    pageAccessToken: string,
  ): Promise<FacebookLikeResponse> {
    const url = `${this.apiBaseUrl}/${objectId}/likes`
    const config: AxiosRequestConfig = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    return this.request<FacebookLikeResponse>(url, config, { operation: 'LIKE_OBJECT' })
  }

  async unlikeObject(
    objectId: string,
    pageAccessToken: string,
  ): Promise<FacebookLikeResponse> {
    const url = `${this.apiBaseUrl}/${objectId}/likes`
    const config: AxiosRequestConfig = {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${pageAccessToken}`,
      },
    }
    return this.request<FacebookLikeResponse>(url, config, { operation: 'UNLIKE_OBJECT' })
  }
}

import { Injectable, Logger } from '@nestjs/common'
import { ApiError, Client, OAuth2 } from '@xdevplatform/xdk'
import axios from 'axios'
import { config } from '../../../../config'
import { TwitterError } from './twitter.exception'
import {
  TwitterFollowingResponse,
  TwitterOAuthCredential,
  TwitterRevokeAccessResponse,
  TwitterUserInfoResponse,
  XBookmarkMutationResponse,
  XBookmarksTimelineRequest,
  XBookmarksTimelineResponse,
  XChunkedMediaUploadRequest,
  XCreateMediaMetadataRequest,
  XCreateMediaMetadataResponse,
  XCreatePostRequest,
  XCreatePostResponse,
  XDeletePostResponse,
  XGetPostDetailResponse,
  XHideReplyResponse,
  XLikedPostsRequest,
  XLikedPostsResponse,
  XLikePostResponse,
  XListListResponse,
  XListRequest,
  XMediaUploadInitRequest,
  XMediaUploadResponse,
  XMentionsTimelineRequest,
  XMentionsTimelineResponse,
  XRePostResponse,
  XSearchTweetsRequest,
  XSearchTweetsResponse,
  XTweetListRequest,
  XTweetListResponse,
  XUserListRequest,
  XUserListResponse,
  XUserTimelineRequest,
  XUserTimelineResponse,
} from './twitter.interfaces'

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name)
  private readonly clientSecret: string
  private readonly clientId: string
  private readonly redirectUri: string
  private readonly apiBaseUrl = 'https://api.x.com/2'
  private readonly oauthRequestHeaders: Record<string, string>

  constructor() {
    this.clientSecret = config.channel.twitter.clientSecret
    this.clientId = config.channel.twitter.clientId
    this.redirectUri = config.channel.twitter.redirectUri
    this.oauthRequestHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(this.clientSecret
        ? {
            Authorization: `Basic ${Buffer.from(
              `${this.clientId}:${this.clientSecret}`,
            ).toString('base64')}`,
          }
        : {}),
    }
  }

  async generateAuthorizeURL(
    scopes: string[],
    state: string,
    codeVerifier: string,
    codeChallenge?: string,
  ): Promise<string> {
    const oauth = this.createOAuth2Client(scopes)
    await oauth.setPkceParameters(codeVerifier, codeChallenge)
    const authorizeURL = await oauth.getAuthorizationUrl(state)
    this.logger.debug(`Generated Twitter auth URL: ${authorizeURL}`)
    return authorizeURL
  }

  async getOAuthCredential(
    code: string,
    codeVerifier: string,
  ): Promise<TwitterOAuthCredential> {
    const oauth = this.createOAuth2Client()

    try {
      const credential = await oauth.exchangeCode(code, codeVerifier)
      if (!credential.refresh_token) {
        throw TwitterError.buildFromUnknownError(
          new Error('Twitter OAuth credential missing refresh token'),
          'getOAuthCredential',
        )
      }

      return credential as TwitterOAuthCredential
    }
    catch (error) {
      this.throwTwitterError(error, 'getOAuthCredential')
    }
  }

  async refreshOAuthCredential(
    refreshToken: string,
  ): Promise<TwitterOAuthCredential> {
    const oauth = this.createOAuth2Client()

    try {
      const credential = await oauth.refreshToken(refreshToken)
      credential.refresh_token ||= refreshToken
      return credential as TwitterOAuthCredential
    }
    catch (error) {
      this.throwTwitterError(error, 'refreshOAuthCredential')
    }
  }

  async revokeOAuthCredential(
    accessToken: string,
  ): Promise<TwitterRevokeAccessResponse> {
    try {
      const params = new URLSearchParams({
        token: accessToken,
      })
      if (!this.clientSecret) {
        params.append('client_id', this.clientId)
      }

      const response = await axios.post<{ revoked?: boolean }>(
        `${this.apiBaseUrl}/oauth2/revoke`,
        params.toString(),
        {
          headers: this.oauthRequestHeaders,
        },
      )

      return {
        revoked: Boolean(response.data?.revoked ?? true),
      }
    }
    catch (error) {
      this.throwTwitterError(error, 'revokeOAuthCredential')
    }
  }

  async getUserInfo(accessToken: string): Promise<TwitterUserInfoResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getMe({
        userFields: [
          'id',
          'name',
          'profile_image_url',
          'username',
          'verified',
          'created_at',
          'protected',
          'public_metrics',
        ],
      }) as TwitterUserInfoResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getUserInfo')
    }
  }

  async followUser(
    accessToken: string,
    sourceUserId: string,
    targetUserId: string,
  ): Promise<TwitterFollowingResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.followUser(sourceUserId, {
        body: {
          targetUserId,
        },
      }) as TwitterFollowingResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'followUser')
    }
  }

  async initMediaUpload(
    accessToken: string,
    req: XMediaUploadInitRequest,
  ): Promise<XMediaUploadResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.media.initializeUpload({
        body: req,
      }) as XMediaUploadResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'initMediaUpload')
    }
  }

  async chunkedMediaUploadRequest(
    accessToken: string,
    req: XChunkedMediaUploadRequest,
  ): Promise<XMediaUploadResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.media.appendUpload(req.media_id, {
        body: {
          media: await this.encodeUploadMedia(req.media),
          segment_index: req.segment_index,
        },
      }) as XMediaUploadResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'chunkedMediaUpload')
    }
  }

  async finalizeMediaUpload(
    accessToken: string,
    mediaId: string,
  ): Promise<XMediaUploadResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.media.finalizeUpload(mediaId) as XMediaUploadResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'finalizeMediaUpload')
    }
  }

  async createPost(
    accessToken: string,
    tweet: XCreatePostRequest,
  ): Promise<XCreatePostResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.posts.create(tweet) as XCreatePostResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'createPost')
    }
  }

  async deletePost(
    accessToken: string,
    postId: string,
  ): Promise<XDeletePostResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.posts.delete(postId) as XDeletePostResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'deletePost')
    }
  }

  async getUserPosts(
    userId: string,
    accessToken: string,
    query: XUserTimelineRequest,
  ): Promise<XUserTimelineResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getPosts(userId, {
        ...query,
        tweetFields: [
          'id',
          'text',
          'author_id',
          'created_at',
          'public_metrics',
          'attachments',
          'media_metadata',
        ],
      }) as XUserTimelineResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getUserPosts')
    }
  }

  async getUserTimeline(
    userId: string,
    accessToken: string,
    query: XUserTimelineRequest,
  ): Promise<XUserTimelineResponse> {
    return this.getHomeTimeline(userId, accessToken, query)
  }

  async getHomeTimeline(
    userId: string,
    accessToken: string,
    query: XUserTimelineRequest,
  ): Promise<XUserTimelineResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getTimeline(userId, {
        ...query,
        tweetFields: [
          'id',
          'text',
          'author_id',
          'created_at',
          'public_metrics',
          'attachments',
          'conversation_id',
          'referenced_tweets',
        ],
      }) as XUserTimelineResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getHomeTimeline')
    }
  }

  async getPostDetail(
    accessToken: string,
    postId: string,
  ): Promise<XGetPostDetailResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.posts.getById(postId, {
        tweetFields: ['author_id', 'created_at', 'public_metrics', 'text', 'attachments'],
        expansions: ['author_id', 'attachments.media_keys'],
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified'],
        mediaFields: ['media_key', 'preview_image_url', 'url', 'variants'],
      }) as XGetPostDetailResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getPostDetail')
    }
  }

  async searchRecentPosts(
    accessToken: string,
    query: string,
    params: XSearchTweetsRequest,
  ): Promise<XSearchTweetsResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.posts.searchRecent(query, {
        ...params,
        tweetFields: [
          'id',
          'text',
          'author_id',
          'created_at',
          'public_metrics',
          'attachments',
          'conversation_id',
          'referenced_tweets',
        ],
      }) as XSearchTweetsResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'searchRecentPosts')
    }
  }

  async getQuotedPosts(
    accessToken: string,
    postId: string,
    query: XTweetListRequest,
  ): Promise<XTweetListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.posts.getQuoted(postId, {
        ...query,
        tweetFields: [
          'id',
          'text',
          'author_id',
          'created_at',
          'public_metrics',
          'attachments',
          'conversation_id',
        ],
      }) as XTweetListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getQuotedPosts')
    }
  }

  async getReposts(
    accessToken: string,
    postId: string,
    query: XTweetListRequest,
  ): Promise<XTweetListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.posts.getReposts(postId, {
        ...query,
        tweetFields: [
          'id',
          'text',
          'author_id',
          'created_at',
          'public_metrics',
          'attachments',
          'conversation_id',
        ],
      }) as XTweetListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getReposts')
    }
  }

  async getRepostedBy(
    accessToken: string,
    postId: string,
    query: XUserListRequest,
  ): Promise<XUserListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.posts.getRepostedBy(postId, {
        ...query,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'public_metrics'],
      }) as XUserListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getRepostedBy')
    }
  }

  async getLikingUsers(
    accessToken: string,
    postId: string,
    query: XUserListRequest,
  ): Promise<XUserListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.posts.getLikingUsers(postId, {
        ...query,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'public_metrics'],
      }) as XUserListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getLikingUsers')
    }
  }

  async getUserByUsername(
    accessToken: string,
    username: string,
  ): Promise<TwitterUserInfoResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getByUsername(username, {
        userFields: [
          'id',
          'name',
          'profile_image_url',
          'username',
          'verified',
          'created_at',
          'protected',
          'public_metrics',
        ],
      }) as TwitterUserInfoResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getUserByUsername')
    }
  }

  async getFollowers(
    accessToken: string,
    userId: string,
    query: XUserListRequest,
  ): Promise<XUserListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getFollowers(userId, {
        ...query,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'created_at', 'protected', 'public_metrics'],
      }) as XUserListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getFollowers')
    }
  }

  async getFollowing(
    accessToken: string,
    userId: string,
    query: XUserListRequest,
  ): Promise<XUserListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getFollowing(userId, {
        ...query,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'created_at', 'protected', 'public_metrics'],
      }) as XUserListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getFollowing')
    }
  }

  async getBlocking(
    accessToken: string,
    userId: string,
    query: XUserListRequest,
  ): Promise<XUserListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getBlocking(userId, {
        ...query,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'created_at', 'protected', 'public_metrics'],
      }) as XUserListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getBlocking')
    }
  }

  async getMuting(
    accessToken: string,
    userId: string,
    query: XUserListRequest,
  ): Promise<XUserListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getMuting(userId, {
        ...query,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'created_at', 'protected', 'public_metrics'],
      }) as XUserListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getMuting')
    }
  }

  async getOwnedLists(
    accessToken: string,
    userId: string,
    query: XListRequest,
  ): Promise<XListListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getOwnedLists(userId, {
        ...query,
        listFields: ['created_at', 'description', 'follower_count', 'member_count', 'owner_id', 'private'],
      }) as XListListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getOwnedLists')
    }
  }

  async getFollowedLists(
    accessToken: string,
    userId: string,
    query: XListRequest,
  ): Promise<XListListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getFollowedLists(userId, {
        ...query,
        listFields: ['created_at', 'description', 'follower_count', 'member_count', 'owner_id', 'private'],
      }) as XListListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getFollowedLists')
    }
  }

  async getListMemberships(
    accessToken: string,
    userId: string,
    query: XListRequest,
  ): Promise<XListListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getListMemberships(userId, {
        ...query,
        listFields: ['created_at', 'description', 'follower_count', 'member_count', 'owner_id', 'private'],
      }) as XListListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getListMemberships')
    }
  }

  async getPinnedLists(
    accessToken: string,
    userId: string,
    query: XListRequest,
  ): Promise<XListListResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getPinnedLists(userId, {
        listFields: ['created_at', 'description', 'follower_count', 'member_count', 'owner_id', 'private'],
        expansions: query.expansions,
        userFields: query.userFields,
      }) as XListListResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getPinnedLists')
    }
  }

  async getLikedPosts(
    accessToken: string,
    userId: string,
    query: XLikedPostsRequest,
  ): Promise<XLikedPostsResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getLikedPosts(userId, {
        ...query,
        tweetFields: [
          'id',
          'text',
          'author_id',
          'created_at',
          'public_metrics',
          'attachments',
          'conversation_id',
          'referenced_tweets',
        ],
      }) as XLikedPostsResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getLikedPosts')
    }
  }

  async getMediaStatus(
    accessToken: string,
    mediaId: string,
  ): Promise<XMediaUploadResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.media.getUploadStatus(mediaId, {
        command: 'STATUS',
      }) as XMediaUploadResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getMediaStatus')
    }
  }

  async createMediaMetadata(
    accessToken: string,
    req: XCreateMediaMetadataRequest,
  ): Promise<XCreateMediaMetadataResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.media.createMetadata({
        body: req,
      }) as XCreateMediaMetadataResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'createMediaMetadata')
    }
  }

  async getUserMentions(
    userId: string,
    accessToken: string,
    query: XMentionsTimelineRequest,
  ): Promise<XMentionsTimelineResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getMentions(userId, {
        ...query,
        tweetFields: [
          'id',
          'text',
          'author_id',
          'created_at',
          'public_metrics',
          'attachments',
        ],
      }) as XMentionsTimelineResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getUserMentions')
    }
  }

  async getBookmarks(
    userId: string,
    accessToken: string,
    query: XBookmarksTimelineRequest,
  ): Promise<XBookmarksTimelineResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.getBookmarks(userId, {
        ...query,
        tweetFields: [
          'id',
          'text',
          'author_id',
          'created_at',
          'public_metrics',
          'attachments',
        ],
      }) as XBookmarksTimelineResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'getBookmarks')
    }
  }

  async bookmarkPost(
    userId: string,
    accessToken: string,
    tweetId: string,
  ): Promise<XBookmarkMutationResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.createBookmark(userId, {
        tweetId,
      }) as XBookmarkMutationResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'bookmarkPost')
    }
  }

  async unbookmarkPost(
    userId: string,
    accessToken: string,
    tweetId: string,
  ): Promise<XBookmarkMutationResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.deleteBookmark(userId, tweetId) as XBookmarkMutationResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'unbookmarkPost')
    }
  }

  async updateReplyHiddenState(
    accessToken: string,
    tweetId: string,
    hidden: boolean,
  ): Promise<XHideReplyResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.posts.hideReply(tweetId, {
        body: {
          hidden,
        },
      }) as XHideReplyResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'updateReplyHiddenState')
    }
  }

  async repostPost(
    userId: string,
    accessToken: string,
    tweetId: string,
  ): Promise<XRePostResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.repostPost(userId, {
        body: { tweetId },
      }) as XRePostResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'repostPost')
    }
  }

  async undoRepostPost(
    userId: string,
    accessToken: string,
    tweetId: string,
  ): Promise<XRePostResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.unrepostPost(userId, tweetId) as XRePostResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'undoRepostPost')
    }
  }

  async likePost(
    userId: string,
    accessToken: string,
    tweetId: string,
  ): Promise<XLikePostResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.likePost(userId, {
        body: { tweetId },
      }) as XLikePostResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'likePost')
    }
  }

  async unlikePost(
    userId: string,
    accessToken: string,
    tweetId: string,
  ): Promise<XLikePostResponse> {
    const client = this.createApiClient(accessToken)

    try {
      return await client.users.unlikePost(userId, tweetId) as XLikePostResponse
    }
    catch (error) {
      this.throwTwitterError(error, 'unlikePost')
    }
  }

  private createOAuth2Client(scopes?: string[]) {
    return new OAuth2({
      clientId: this.clientId,
      clientSecret: this.clientSecret || undefined,
      redirectUri: this.redirectUri,
      scope: scopes,
    })
  }

  private createApiClient(accessToken: string) {
    return new Client({
      accessToken,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  private async encodeUploadMedia(
    media: XChunkedMediaUploadRequest['media'],
  ): Promise<string> {
    if (media instanceof Blob) {
      const arrayBuffer = await media.arrayBuffer()
      return Buffer.from(arrayBuffer).toString('base64')
    }

    if (media instanceof ArrayBuffer) {
      return Buffer.from(media).toString('base64')
    }

    if (ArrayBuffer.isView(media)) {
      return Buffer.from(
        media.buffer,
        media.byteOffset,
        media.byteLength,
      ).toString('base64')
    }

    return Buffer.from(media).toString('base64')
  }

  private throwTwitterError(error: unknown, operation: string): never {
    const err = error instanceof TwitterError
      ? error
      : error instanceof ApiError
        ? TwitterError.buildFromApiError(error, operation)
        : TwitterError.buildFromError(error, operation)

    this.logger.error(
      err,
      `[twitter:${operation}] Error !! kind=${err.kind} httpStatus=${err.cause.httpStatus ?? 'N/A'} platformCode=${err.cause.platformCode ?? 'N/A'} platformMessage=${err.cause.platformMessage || 'N/A'}`,
    )
    throw err
  }
}

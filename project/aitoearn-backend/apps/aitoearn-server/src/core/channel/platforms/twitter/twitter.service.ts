import { randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { generateCodeChallenge, generateCodeVerifier } from '@xdevplatform/xdk'
import { AccountStatus, AccountType, NewAccount, PublishType } from '@yikart/aitoearn-server-client'
import { AppException, getErrorMessage, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import { v4 as uuidV4 } from 'uuid'
import { getCurrentTimestamp } from '../../../../common/utils/time.util'
import { config } from '../../../../config'
import { RelayAccountException } from '../../../relay/relay-account.exception'
import { RelayAuthException } from '../../../relay/relay-auth.exception'
import { ChannelRedisKeys } from '../../channel.constants'
import { TwitterError } from '../../libs/twitter/twitter.exception'
import {
  TwitterOAuthCredential,
  TwitterUserInfo,
  XBookmarkMutationResponse,
  XBookmarksTimelineRequest,
  XBookmarksTimelineResponse,
  XChunkedMediaUploadRequest,
  XCreateMediaMetadataRequest,
  XCreatePostRequest,
  XCreatePostResponse,
  XGetPostDetailResponse,
  XHideReplyResponse,
  XLikedPostsRequest,
  XLikedPostsResponse,
  XLikePostResponse,
  XListInfo,
  XListListResponse,
  XListRequest,
  XMediaUploadInitRequest,
  XMediaUploadResponse,
  XMentionsTimelineRequest,
  XMentionsTimelineResponse,
  XPostDetailResponseData,
  XRePostResponse,
  XSearchTweetsRequest,
  XSearchTweetsResponse,
  XTweetIncludeMedia,
  XTweetListRequest,
  XTweetListResponse,
  XUserListRequest,
  XUserListResponse,
  XUserTimelineRequest,
  XUserTimelineResponse,
} from '../../libs/twitter/twitter.interfaces'
import { TwitterService as TwitterApiService } from '../../libs/twitter/twitter.service'
import { PlatformBaseService, ValidatedWorkInfo, WorkDetailInfo } from '../base.service'
import { ChannelAccountService } from '../channel-account.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { TWITTER_TIME_CONSTANTS } from './constants'
import { TwitterBillingService, TwitterReadResource, TwitterReadResourceType, TwitterWriteChargeType } from './twitter-billing.service'
import {
  TwitterBookmarksDto,
  TwitterHomeTimelineDto,
  TwitterMentionsDto,
  TwitterMyLikedPostsDto,
  TwitterMyListDto,
  TwitterMyPinnedListDto,
  TwitterMyPostsDto,
  TwitterMyUserListDto,
  TwitterSearchTweetsDto,
  TwitterTweetListDto,
  TwitterUserByUsernameDto,
  TwitterUserLikedPostsDto,
  TwitterUserListDto,
  TwitterUserPostsDto,
  UserTimelineDto,
} from './twitter.dto'
import { TwitterOAuthTaskInfo } from './twitter.interfaces'

const TWITTER_PINNED_LIST_LIMIT = 16

@Injectable()
export class TwitterService extends PlatformBaseService {
  protected override readonly platform: AccountType = AccountType.TWITTER
  protected override readonly logger = new Logger(TwitterService.name)
  private readonly redisService: RedisService
  private readonly twitterApiService: TwitterApiService
  private readonly channelAccountService: ChannelAccountService
  private readonly twitterBillingService: TwitterBillingService
  private readonly defaultScopes = [
    'tweet.read', // All the Tweets you can view, including Tweets from protected accounts.
    'tweet.write', // Tweet and Retweet for you.
    'tweet.moderate.write', // Hide and unhide replies to your Tweets.
    'users.email', // Email from an authenticated user.
    'users.read', // Any account you can view, including protected accounts.
    'follows.read', // People who follow you and people who you follow.
    'follows.write', // Follow and unfollow people for you.
    'offline.access', // Stay connected to your account until you revoke access.
    'space.read', // All the Spaces you can view.
    'mute.read', // Accounts you've muted.
    'mute.write', // Mute and unmute accounts for you.
    'like.read', // Tweets you've liked and likes you can view.
    'like.write', // Like and un-like Tweets for you.
    'list.read', // Lists, list members, and list followers of lists you've created or are a member of, including private lists.
    'list.write', // Create and manage Lists for you.
    'block.read', // Accounts you've blocked.
    'block.write', // Block and unblock accounts for you.
    'bookmark.read', // Get Bookmarked Tweets from an authenticated user.
    'bookmark.write', // Bookmark and remove Bookmarks from Tweets.
    'media.write', // Upload media.
  ]

  constructor(
    redisService: RedisService,
    twitterApiService: TwitterApiService,
    channelAccountService: ChannelAccountService,
    twitterBillingService: TwitterBillingService,
  ) {
    super()
    this.redisService = redisService
    this.twitterApiService = twitterApiService
    this.channelAccountService = channelAccountService
    this.twitterBillingService = twitterBillingService
  }

  private async saveOAuthCredential(accountId: string, accessTokenInfo: TwitterOAuthCredential) {
    accessTokenInfo.expires_in = accessTokenInfo.expires_in + getCurrentTimestamp() - TWITTER_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    const cached = await this.redisService.setJson(
      ChannelRedisKeys.accessToken('twitter', accountId),
      accessTokenInfo,
    )
    const persistResult = await this.oauth2CredentialRepository.upsertOne(
      accountId,
      this.platform,
      {
        accessToken: accessTokenInfo.access_token,
        refreshToken: accessTokenInfo.refresh_token,
        accessTokenExpiresAt: accessTokenInfo.expires_in,
      },
    )
    return cached && persistResult
  }

  private async getOAuth2Credential(accountId: string): Promise<TwitterOAuthCredential | null> {
    let credential = await this.redisService.getJson<TwitterOAuthCredential>(
      ChannelRedisKeys.accessToken('twitter', accountId),
    )
    if (!credential) {
      const oauth2Credential = await this.oauth2CredentialRepository.getOne(
        accountId,
        this.platform,
      )
      if (!oauth2Credential) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      credential = {
        access_token: oauth2Credential.accessToken,
        refresh_token: oauth2Credential.refreshToken,
        expires_in: oauth2Credential.accessTokenExpiresAt,
      }
    }
    return credential
  }

  private async authorize(accountId: string): Promise<TwitterOAuthCredential> {
    const credential = await this.getOAuth2Credential(accountId)
    if (!credential) {
      throw new PlatformAuthExpiredException(this.platform, accountId)
    }
    const now = getCurrentTimestamp()
    if (now >= credential.expires_in) {
      this.logger.debug(
        `Access token for accountId: ${accountId} is expired, refreshing...`,
      )
      const refreshedToken = await this.refreshOAuthCredential(
        accountId,
        credential.refresh_token,
      )
      credential.access_token = refreshedToken.access_token
      credential.refresh_token = refreshedToken.refresh_token
      credential.expires_in = refreshedToken.expires_in
      const saved = await this.saveOAuthCredential(accountId, credential)
      if (!saved) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      return credential
    }
    return credential
  }

  private async refreshOAuthCredential(
    accountId: string,
    refreshToken: string,
  ): Promise<TwitterOAuthCredential> {
    try {
      const credential
        = await this.twitterApiService.refreshOAuthCredential(refreshToken)
      if (!credential) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      return credential
    }
    catch (error) {
      if (error instanceof PlatformAuthExpiredException) {
        throw error
      }
      if (error instanceof TwitterError && error.cause.httpStatus && [400, 401].includes(error.cause.httpStatus)) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
      this.logger.error(`Error: ${getErrorMessage(error)}`)
      throw error
    }
  }

  private async getTwitterAccount(userId: string, accountId: string) {
    const account = await this.accountRepository.getByIdAndUserId(accountId, userId)
    if (!account) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    if (account.type !== AccountType.TWITTER) {
      throw new AppException(ResponseCode.ChannelAccountNotFound)
    }
    return account
  }

  private async getAuthorizedTwitterAccount(userId: string, accountId: string) {
    const account = await this.getTwitterAccount(userId, accountId)
    const credential = await this.authorize(accountId)
    if (!account.uid) {
      throw new AppException(ResponseCode.ChannelAccountInfoFailed)
    }
    return {
      account,
      credential,
    }
  }

  private parseUsername(username: string) {
    return username.trim().replace(/^@+/, '')
  }

  private parseMaxResults(maxResults?: string) {
    if (!maxResults) {
      return 10
    }

    const parsed = Number.parseInt(maxResults, 10)
    if (Number.isNaN(parsed) || parsed <= 0) {
      return 10
    }

    return parsed
  }

  private getCreatePostChargeType(text?: string) {
    return this.twitterBillingService.containsUrl(text)
      ? TwitterWriteChargeType.ContentCreateWithUrl
      : TwitterWriteChargeType.ContentCreate
  }

  private collectPostReadResources(posts?: XPostDetailResponseData[]): TwitterReadResource[] {
    if (!posts || posts.length === 0) {
      return []
    }

    return posts
      .filter(post => !!post.id)
      .map(post => ({
        type: TwitterReadResourceType.Post,
        id: post.id!,
      }))
  }

  private collectUserReadResources(users?: TwitterUserInfo[]): TwitterReadResource[] {
    if (!users || users.length === 0) {
      return []
    }

    return users
      .filter(user => !!user.id)
      .map(user => ({
        type: TwitterReadResourceType.User,
        id: user.id!,
      }))
  }

  private collectMediaReadResources(media?: XTweetIncludeMedia[]): TwitterReadResource[] {
    if (!media || media.length === 0) {
      return []
    }

    return media
      .filter(item => !!item.mediaKey)
      .map(item => ({
        type: TwitterReadResourceType.Media,
        id: item.mediaKey!,
      }))
  }

  private collectListReadResources(lists?: XListInfo[]): TwitterReadResource[] {
    if (!lists || lists.length === 0) {
      return []
    }

    return lists
      .filter(list => !!list.id)
      .map(list => ({
        type: TwitterReadResourceType.List,
        id: list.id!,
      }))
  }

  private buildTweetUrl(tweetId: string) {
    return `https://x.com/i/web/status/${tweetId}`
  }

  private buildTweetListQuery(queryDto: TwitterTweetListDto): XTweetListRequest {
    return {
      paginationToken: queryDto.paginationToken,
      maxResults: this.parseMaxResults(queryDto.maxResults),
      mediaFields: ['url', 'preview_image_url', 'variants'],
      expansions: ['attachments.media_keys', 'author_id'],
      userFields: ['id', 'name', 'username', 'profile_image_url', 'verified'],
    }
  }

  private buildUserListQuery(queryDto: TwitterTweetListDto): XUserListRequest {
    return {
      paginationToken: queryDto.paginationToken,
      maxResults: this.parseMaxResults(queryDto.maxResults),
      userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'public_metrics'],
    }
  }

  private async getPostUsers(
    userId: string,
    accountId: string,
    queryDto: TwitterTweetListDto,
    operation: 'getRepostedBy' | 'getLikingUsers',
    endpoint: string,
  ): Promise<XUserListResponse> {
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    const { credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User),
    })
    const response = operation === 'getRepostedBy'
      ? await this.twitterApiService.getRepostedBy(
          credential.access_token,
          queryDto.tweetId,
          this.buildUserListQuery(queryDto),
        )
      : await this.twitterApiService.getLikingUsers(
          credential.access_token,
          queryDto.tweetId,
          this.buildUserListQuery(queryDto),
        )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation,
      endpoint,
      resources: this.collectUserReadResources(response.data),
      metadata: {
        tweetId: queryDto.tweetId,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  private buildSearchQuery(queryDto: TwitterSearchTweetsDto | TwitterMentionsDto): XSearchTweetsRequest {
    return {
      startTime: queryDto.startTime,
      endTime: queryDto.endTime,
      sinceId: queryDto.sinceId,
      untilId: queryDto.untilId,
      paginationToken: queryDto.paginationToken,
      maxResults: this.parseMaxResults(queryDto.maxResults),
      mediaFields: ['url', 'preview_image_url', 'variants'],
      expansions: ['attachments.media_keys', 'author_id'],
      userFields: ['id', 'name', 'username', 'profile_image_url', 'verified'],
    }
  }

  async generateAuthorizeURL(data: {
    userId: string
    scopes?: string[]
    spaceId?: string
    callbackUrl?: string
    callbackMethod?: 'GET' | 'POST'
  }) {
    if (!config.channel.twitter.clientId && config.relay) {
      throw new RelayAuthException()
    }
    const taskId = uuidV4()
    const codeVerifier = generateCodeVerifier(64)
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = randomBytes(32).toString('hex')
    const authTaskInfo: TwitterOAuthTaskInfo = {
      state,
      status: 0,
      userId: data.userId,
      codeVerifier,
      taskId,
      spaceId: data.spaceId,
      callbackUrl: data.callbackUrl,
      callbackMethod: data.callbackMethod,
    }
    const success = await this.redisService.setJson(
      ChannelRedisKeys.authTask('twitter', state),
      authTaskInfo,
      TWITTER_TIME_CONSTANTS.AUTH_TASK_EXPIRE,
    )
    const scopes = data.scopes || this.defaultScopes
    const authorizeURL = await this.twitterApiService.generateAuthorizeURL(
      scopes,
      state,
      codeVerifier,
      codeChallenge,
    )
    return success ? { url: authorizeURL, taskId: state, state } : null
  }

  async getOAuth2TaskInfo(state: string) {
    return await this.redisService.getJson<TwitterOAuthTaskInfo>(
      ChannelRedisKeys.authTask('twitter', state),
    )
  }

  async postOAuth2Callback(
    state: string,
    authData: { code: string, state: string },
  ) {
    const { code } = authData

    const authTaskInfo = await this.getOAuth2TaskInfo(state)
    if (!authTaskInfo) {
      this.logger.error(`OAuth task not found for state: ${state}`)
      return {
        status: 0,
        message: 'OAuth task not found or expired',
      }
    }

    // Extend the OAuth task lifetime.
    void this.redisService.expire(
      ChannelRedisKeys.authTask('twitter', state),
      TWITTER_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )

    const credential = await this.twitterApiService.getOAuthCredential(
      code,
      authTaskInfo.codeVerifier,
    )
    if (!credential) {
      this.logger.error(`Failed to get access token for state: ${state}`)
      return {
        status: 0,
        message: 'Failed to get access token',
      }
    }

    // fetch twitter user profile
    const userRes = await this.twitterApiService.getUserInfo(
      credential.access_token,
    )
    if (!userRes.data) {
      this.logger.error(`Failed to get user profile for state: ${state}`)
      return {
        status: 0,
        message: `Failed to get user info: ${JSON.stringify(userRes.errors)}`,
      }
    }

    const newAccountData = new NewAccount({
      userId: authTaskInfo.userId,
      type: AccountType.TWITTER,
      uid: userRes.data.id,
      account: userRes.data.username,
      avatar: userRes.data.profileImageUrl,
      nickname: userRes.data.name,
      lastStatsTime: new Date(),
      loginTime: new Date(),
      groupId: authTaskInfo.spaceId,
      status: AccountStatus.NORMAL,
    })

    const accountInfo = await this.channelAccountService.createAccount(
      {
        type: AccountType.TWITTER,
        uid: userRes.data.id,
      },
      newAccountData,
    )
    if (!accountInfo) {
      this.logger.error(
        `Failed to create account for userId: ${authTaskInfo.userId}, twitterId: ${userRes.data.id}`,
      )
      return {
        status: 0,
        message: 'Failed to create account',
      }
    }
    const tokenSaved = await this.saveOAuthCredential(
      accountInfo.id,
      credential,
    )
    if (!tokenSaved) {
      this.logger.error(
        `Failed to save access token for accountId: ${accountInfo.id}`,
      )
      return {
        status: 0,
        message: 'Failed to save access token',
      }
    }
    await this.syncAuthorizedAccountStatistics(accountInfo.id, userRes.data)
    const taskUpdated = await this.updateAuthTaskStatus(
      state,
      authTaskInfo,
      accountInfo.id,
    )

    if (!taskUpdated) {
      this.logger.error(
        `Failed to update auth task status for state: ${state}, accountId: ${accountInfo.id}`,
      )
      return {
        status: 0,
        message: 'Failed to update auth task status',
      }
    }
    return {
      status: 1,
      message: 'Authorization succeeded',
      accountId: accountInfo.id,
      callbackUrl: authTaskInfo.callbackUrl,
      callbackMethod: authTaskInfo.callbackMethod,
      taskId: state,
      nickname: userRes.data.name,
      avatar: userRes.data.profileImageUrl,
      platformUid: userRes.data.id,
      accountType: AccountType.TWITTER,
    }
  }

  private async updateAuthTaskStatus(
    state: string,
    authTaskInfo: TwitterOAuthTaskInfo,
    accountId: string,
  ): Promise<boolean> {
    authTaskInfo.status = 1
    authTaskInfo.accountId = accountId

    return await this.redisService.setJson(
      ChannelRedisKeys.authTask('twitter', state),
      authTaskInfo,
      TWITTER_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )
  }

  private async revokeOAuthCredential(accountId: string): Promise<boolean> {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.warn(`No access token found for accountId: ${accountId}`)
      return false
    }
    const result = await this.twitterApiService.revokeOAuthCredential(
      credential.access_token,
    )
    if (result.revoked) {
      await this.redisService.del(
        ChannelRedisKeys.accessToken('twitter', accountId),
      )
      return true
    }
    return false
  }

  public async getUserInfo(accountId: string) {
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User),
    })
    const credential = await this.authorize(accountId)
    const response = await this.twitterApiService.getUserInfo(credential.access_token)
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getUserInfo',
      endpoint: 'GET /2/users/me',
      resources: response.data?.id
        ? [{ type: TwitterReadResourceType.User, id: response.data.id }]
        : [],
    })
    return response
  }

  private async syncAuthorizedAccountStatistics(accountId: string, user: TwitterUserInfo) {
    await this.syncAccountStatisticsOnAuth(accountId, async () => ({
      fansCount: user.publicMetrics?.followersCount,
    }))
  }

  public async getUserInfoForUser(userId: string, accountId: string) {
    const { credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User),
    })
    const response = await this.twitterApiService.getUserInfo(credential.access_token)
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getUserInfo',
      endpoint: 'GET /2/users/me',
      resources: response.data?.id
        ? [{ type: TwitterReadResourceType.User, id: response.data.id }]
        : [],
    })
    return response
  }

  public async resolveTweet(userId: string, accountId: string, tweetRef: string) {
    await this.getAuthorizedTwitterAccount(userId, accountId)
    const resolvedUrl = await this.normalizeTwitterWorkLink(tweetRef)
    const tweetId = this.parseTwitterUrl(resolvedUrl)
    if (!tweetId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }
    return {
      tweetId,
      tweetUrl: this.buildTweetUrl(tweetId),
      resolvedUrl,
    }
  }

  public async getUserByUsername(userId: string, accountId: string, data: TwitterUserByUsernameDto) {
    const { credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User),
    })
    const username = this.parseUsername(data.username)
    const response = await this.twitterApiService.getUserByUsername(credential.access_token, username)
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getUserByUsername',
      endpoint: 'GET /2/users/by/username/:username',
      resources: response.data?.id
        ? [{ type: TwitterReadResourceType.User, id: response.data.id }]
        : [],
      metadata: {
        username,
      },
    })
    return response
  }

  public async searchTweets(userId: string, accountId: string, data: TwitterSearchTweetsDto): Promise<XSearchTweetsResponse> {
    const maxResults = this.parseMaxResults(data.maxResults)
    const { credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * (
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4
      ),
    })
    const response = await this.twitterApiService.searchRecentPosts(
      credential.access_token,
      data.query,
      this.buildSearchQuery(data),
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'searchTweets',
      endpoint: 'GET /2/tweets/search/recent',
      resources: [
        ...this.collectPostReadResources(response.data),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        query: data.query,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  public async followUser(accountId: string, targetUserId: string) {
    const account = await this.getLocalAccountById(accountId)
    if (!account || !account.uid) {
      throw new AppException(ResponseCode.ChannelAccountInfoFailed)
    }
    const credential = await this.authorize(accountId)
    const amount = this.twitterBillingService.getWriteChargeAmount(
      TwitterWriteChargeType.InteractionCreate,
    )
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount,
    })
    const response = await this.twitterApiService.followUser(
      credential.access_token,
      account.uid,
      targetUserId,
    )
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: 'followUser',
      endpoint: 'POST /2/users/:id/following',
      chargeType: TwitterWriteChargeType.InteractionCreate,
      metadata: {
        targetUserId,
      },
    })
    return response
  }

  public async initMediaUpload(accountId: string, req: XMediaUploadInitRequest) {
    const credential = await this.authorize(accountId)
    return await this.twitterApiService.initMediaUpload(credential.access_token, req)
  }

  public async chunkedMediaUploadRequest(accountId: string, req: XChunkedMediaUploadRequest) {
    const credential = await this.authorize(accountId)
    return await this.twitterApiService.chunkedMediaUploadRequest(credential.access_token, req)
  }

  public async finalizeMediaUpload(accountId: string, mediaId: string) {
    const credential = await this.authorize(accountId)
    return await this.twitterApiService.finalizeMediaUpload(credential.access_token, mediaId)
  }

  public async createMediaMetadata(accountId: string, req: XCreateMediaMetadataRequest) {
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getWriteChargeAmount(TwitterWriteChargeType.MediaMetadata),
    })
    const credential = await this.authorize(accountId)
    const response = await this.twitterApiService.createMediaMetadata(credential.access_token, req)
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: 'createMediaMetadata',
      endpoint: 'POST /2/media/metadata',
      chargeType: TwitterWriteChargeType.MediaMetadata,
      metadata: {
        mediaId: req.id,
        hasAltText: Boolean(req.metadata.altText?.text),
      },
    })
    return response
  }

  public async createPost(accountId: string, post: XCreatePostRequest) {
    const chargeType = this.getCreatePostChargeType(post.text)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getWriteChargeAmount(chargeType),
    })
    const credential = await this.authorize(accountId)
    const response = await this.twitterApiService.createPost(credential.access_token, post)
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: 'createPost',
      endpoint: 'POST /2/tweets',
      chargeType,
      metadata: {
        postId: response.data?.id,
        hasMedia: Boolean(post.media?.mediaIds?.length),
        hasPoll: Boolean(post.poll),
        isReply: Boolean(post.reply?.inReplyToTweetId),
        isQuote: Boolean(post.quoteTweetId),
      },
    })
    return response
  }

  override async deletePost(accountId: string, tweetId: string): Promise<boolean> {
    const amount = this.twitterBillingService.getWriteChargeAmount(
      TwitterWriteChargeType.ContentManage,
    )
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount,
    })
    const credential = await this.authorize(accountId)
    const result = await this.twitterApiService.deletePost(
      credential.access_token,
      tweetId,
    )
    if (result.data?.deleted) {
      await this.twitterBillingService.chargeWriteOperation({
        accountId,
        operation: 'deletePost',
        endpoint: 'DELETE /2/tweets/:id',
        chargeType: TwitterWriteChargeType.ContentManage,
        metadata: {
          postId: tweetId,
        },
      })
    }
    return Boolean(result.data?.deleted)
  }

  public async getMediaUploadStatus(
    accountId: string,
    mediaId: string,
  ): Promise<XMediaUploadResponse> {
    const credential = await this.authorize(accountId)
    return await this.twitterApiService.getMediaStatus(
      credential.access_token,
      mediaId,
    )
  }

  async getUserMentions(userId: string, accountId: string, queryDto: TwitterMentionsDto): Promise<XMentionsTimelineResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * (
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4
      ),
    })
    const query: XMentionsTimelineRequest = {
      startTime: queryDto.startTime,
      endTime: queryDto.endTime,
      sinceId: queryDto.sinceId,
      untilId: queryDto.untilId,
      paginationToken: queryDto.paginationToken,
      maxResults,
      mediaFields: ['url', 'preview_image_url', 'variants'],
      expansions: ['attachments.media_keys', 'author_id'],
      userFields: ['id', 'name', 'username', 'profile_image_url', 'verified'],
    }
    const response = await this.twitterApiService.getUserMentions(
      account.uid!,
      credential.access_token,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getUserMentions',
      endpoint: 'GET /2/users/:id/mentions',
      resources: [
        ...this.collectPostReadResources(response.data),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getBookmarks(userId: string, accountId: string, queryDto: TwitterBookmarksDto): Promise<XBookmarksTimelineResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * (
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4
      ),
    })
    const query: XBookmarksTimelineRequest = {
      paginationToken: queryDto.paginationToken,
      maxResults,
      mediaFields: ['url', 'preview_image_url', 'variants'],
      expansions: ['attachments.media_keys', 'author_id'],
      userFields: ['id', 'name', 'username', 'profile_image_url', 'verified'],
    }
    const response = await this.twitterApiService.getBookmarks(
      account.uid!,
      credential.access_token,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getBookmarks',
      endpoint: 'GET /2/users/:id/bookmarks',
      resources: [
        ...this.collectPostReadResources(response.data),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getHomeTimelineForUser(userId: string, accountId: string, queryDto: TwitterHomeTimelineDto): Promise<XUserTimelineResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * (
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4
      ),
    })
    const query: XUserTimelineRequest = {
      startTime: queryDto.startTime,
      endTime: queryDto.endTime,
      sinceId: queryDto.sinceId,
      untilId: queryDto.untilId,
      paginationToken: queryDto.paginationToken,
      exclude: queryDto.exclude,
      maxResults,
      mediaFields: ['url', 'preview_image_url', 'variants'],
      expansions: ['attachments.media_keys', 'author_id'],
      userFields: ['id', 'name', 'username', 'profile_image_url', 'verified'],
    }
    const response = await this.twitterApiService.getHomeTimeline(
      account.uid!,
      credential.access_token,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getHomeTimeline',
      endpoint: 'GET /2/users/:id/timelines/reverse_chronological',
      resources: [
        ...this.collectPostReadResources(response.data),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getFollowersForUser(userId: string, accountId: string, targetUserId: string, queryDto: TwitterUserListDto): Promise<XUserListResponse> {
    const { credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User),
    })
    const response = await this.twitterApiService.getFollowers(
      credential.access_token,
      targetUserId,
      {
        paginationToken: queryDto.paginationToken,
        maxResults,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'public_metrics'],
      },
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getFollowers',
      endpoint: 'GET /2/users/:id/followers',
      resources: this.collectUserReadResources(response.data),
      metadata: {
        targetUserId,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getMyFollowersForUser(userId: string, accountId: string, queryDto: TwitterMyUserListDto): Promise<XUserListResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User),
    })
    const response = await this.twitterApiService.getFollowers(
      credential.access_token,
      account.uid!,
      {
        paginationToken: queryDto.paginationToken,
        maxResults,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'public_metrics'],
      },
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getMyFollowers',
      endpoint: 'GET /2/users/:id/followers',
      resources: this.collectUserReadResources(response.data),
      metadata: {
        targetUserId: account.uid,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getFollowingForUser(userId: string, accountId: string, targetUserId: string, queryDto: TwitterUserListDto): Promise<XUserListResponse> {
    const { credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User),
    })
    const response = await this.twitterApiService.getFollowing(
      credential.access_token,
      targetUserId,
      {
        paginationToken: queryDto.paginationToken,
        maxResults,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'public_metrics'],
      },
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getFollowing',
      endpoint: 'GET /2/users/:id/following',
      resources: this.collectUserReadResources(response.data),
      metadata: {
        targetUserId,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getMyFollowingForUser(userId: string, accountId: string, queryDto: TwitterMyUserListDto): Promise<XUserListResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User),
    })
    const response = await this.twitterApiService.getFollowing(
      credential.access_token,
      account.uid!,
      {
        paginationToken: queryDto.paginationToken,
        maxResults,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'public_metrics'],
      },
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getMyFollowing',
      endpoint: 'GET /2/users/:id/following',
      resources: this.collectUserReadResources(response.data),
      metadata: {
        targetUserId: account.uid,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getMyBlocksForUser(userId: string, accountId: string, queryDto: TwitterMyUserListDto): Promise<XUserListResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User),
    })
    const response = await this.twitterApiService.getBlocking(
      credential.access_token,
      account.uid!,
      {
        paginationToken: queryDto.paginationToken,
        maxResults,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'public_metrics'],
      },
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getMyBlocks',
      endpoint: 'GET /2/users/:id/blocking',
      resources: this.collectUserReadResources(response.data),
      metadata: {
        targetUserId: account.uid,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getMyMutesForUser(userId: string, accountId: string, queryDto: TwitterMyUserListDto): Promise<XUserListResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User),
    })
    const response = await this.twitterApiService.getMuting(
      credential.access_token,
      account.uid!,
      {
        paginationToken: queryDto.paginationToken,
        maxResults,
        userFields: ['id', 'name', 'username', 'profile_image_url', 'verified', 'public_metrics'],
      },
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getMyMutes',
      endpoint: 'GET /2/users/:id/muting',
      resources: this.collectUserReadResources(response.data),
      metadata: {
        targetUserId: account.uid,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getMyOwnedListsForUser(userId: string, accountId: string, queryDto: TwitterMyListDto): Promise<XListListResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.List),
    })
    const query: XListRequest = {
      paginationToken: queryDto.paginationToken,
      maxResults,
    }
    const response = await this.twitterApiService.getOwnedLists(
      credential.access_token,
      account.uid!,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getMyOwnedLists',
      endpoint: 'GET /2/users/:id/owned_lists',
      resources: this.collectListReadResources(response.data),
      metadata: {
        targetUserId: account.uid,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getMyFollowedListsForUser(userId: string, accountId: string, queryDto: TwitterMyListDto): Promise<XListListResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.List),
    })
    const query: XListRequest = {
      paginationToken: queryDto.paginationToken,
      maxResults,
    }
    const response = await this.twitterApiService.getFollowedLists(
      credential.access_token,
      account.uid!,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getMyFollowedLists',
      endpoint: 'GET /2/users/:id/followed_lists',
      resources: this.collectListReadResources(response.data),
      metadata: {
        targetUserId: account.uid,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getMyListMembershipsForUser(userId: string, accountId: string, queryDto: TwitterMyListDto): Promise<XListListResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.List),
    })
    const query: XListRequest = {
      paginationToken: queryDto.paginationToken,
      maxResults,
    }
    const response = await this.twitterApiService.getListMemberships(
      credential.access_token,
      account.uid!,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getMyListMemberships',
      endpoint: 'GET /2/users/:id/list_memberships',
      resources: this.collectListReadResources(response.data),
      metadata: {
        targetUserId: account.uid,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getMyPinnedListsForUser(userId: string, accountId: string, _queryDto: TwitterMyPinnedListDto): Promise<XListListResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: TWITTER_PINNED_LIST_LIMIT * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.List),
    })
    const response = await this.twitterApiService.getPinnedLists(
      credential.access_token,
      account.uid!,
      {},
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getMyPinnedLists',
      endpoint: 'GET /2/users/:id/pinned_lists',
      resources: this.collectListReadResources(response.data),
      metadata: {
        targetUserId: account.uid,
        requestedMaxResults: TWITTER_PINNED_LIST_LIMIT,
      },
    })
    return response
  }

  async getLikedPostsForUser(userId: string, accountId: string, targetUserId: string, queryDto: TwitterUserLikedPostsDto): Promise<XLikedPostsResponse> {
    const { credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * (
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4
      ),
    })
    const query: XLikedPostsRequest = {
      paginationToken: queryDto.paginationToken,
      maxResults,
      mediaFields: ['url', 'preview_image_url', 'variants'],
      expansions: ['attachments.media_keys', 'author_id'],
      userFields: ['id', 'name', 'username', 'profile_image_url', 'verified'],
    }
    const response = await this.twitterApiService.getLikedPosts(
      credential.access_token,
      targetUserId,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getLikedPosts',
      endpoint: 'GET /2/users/:id/liked_tweets',
      resources: [
        ...this.collectPostReadResources(response.data),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        targetUserId,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async bookmarkPost(
    userId: string,
    accountId: string,
    tweetId: string,
  ): Promise<XBookmarkMutationResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getWriteChargeAmount(
        TwitterWriteChargeType.Bookmark,
      ),
    })
    const response = await this.twitterApiService.bookmarkPost(
      account.uid!,
      credential.access_token,
      tweetId,
    )
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: 'bookmarkPost',
      endpoint: 'POST /2/users/:id/bookmarks',
      chargeType: TwitterWriteChargeType.Bookmark,
      metadata: {
        tweetId,
      },
    })
    return response
  }

  async unbookmarkPost(
    userId: string,
    accountId: string,
    tweetId: string,
  ): Promise<XBookmarkMutationResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getWriteChargeAmount(
        TwitterWriteChargeType.Bookmark,
      ),
    })
    const response = await this.twitterApiService.unbookmarkPost(
      account.uid!,
      credential.access_token,
      tweetId,
    )
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: 'unbookmarkPost',
      endpoint: 'DELETE /2/users/:id/bookmarks/:tweetId',
      chargeType: TwitterWriteChargeType.Bookmark,
      metadata: {
        tweetId,
      },
    })
    return response
  }

  async hideReply(
    userId: string,
    accountId: string,
    tweetId: string,
  ): Promise<XHideReplyResponse> {
    return await this.updateReplyHiddenState(userId, accountId, tweetId, true)
  }

  async unhideReply(
    userId: string,
    accountId: string,
    tweetId: string,
  ): Promise<XHideReplyResponse> {
    return await this.updateReplyHiddenState(userId, accountId, tweetId, false)
  }

  private async updateReplyHiddenState(
    userId: string,
    accountId: string,
    tweetId: string,
    hidden: boolean,
  ): Promise<XHideReplyResponse> {
    await this.getTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getWriteChargeAmount(
        TwitterWriteChargeType.ContentManage,
      ),
    })
    const credential = await this.authorize(accountId)
    const response = await this.twitterApiService.updateReplyHiddenState(
      credential.access_token,
      tweetId,
      hidden,
    )
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: hidden ? 'hideReply' : 'unhideReply',
      endpoint: 'PUT /2/tweets/:id/hidden',
      chargeType: TwitterWriteChargeType.ContentManage,
      metadata: {
        tweetId,
        hidden,
      },
    })
    return response
  }

  async getUserTimeline(
    accountId: string,
    userId: string,
    queryDto: UserTimelineDto,
  ) {
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post),
    })
    const credential = await this.authorize(accountId)
    const query: XUserTimelineRequest = {
      startTime: queryDto.startTime,
      endTime: queryDto.endTime,
      sinceId: queryDto.sinceId,
      untilId: queryDto.untilId,
      paginationToken: queryDto.paginationToken,
      exclude: queryDto.exclude,
      maxResults,
    }
    const response = await this.twitterApiService.getUserTimeline(
      userId,
      credential.access_token,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getUserTimeline',
      endpoint: 'GET /2/users/:id/timelines/reverse_chronological',
      resources: this.collectPostReadResources(response.data),
      metadata: {
        targetUserId: userId,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getUserPosts(
    accountId: string,
    userId: string,
    queryDto: UserTimelineDto,
  ) {
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * (
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4
      ),
    })
    const credential = await this.authorize(accountId)
    const query: XUserTimelineRequest = {
      startTime: queryDto.startTime,
      endTime: queryDto.endTime,
      sinceId: queryDto.sinceId,
      untilId: queryDto.untilId,
      paginationToken: queryDto.paginationToken,
      maxResults,
      exclude: queryDto.exclude || ['replies', 'retweets'],
      mediaFields: ['url', 'preview_image_url', 'variants'],
      expansions: ['attachments.media_keys'],
    }
    const response = await this.twitterApiService.getUserPosts(
      userId,
      credential.access_token,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getUserPosts',
      endpoint: 'GET /2/users/:id/tweets',
      resources: [
        ...this.collectPostReadResources(response.data),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        targetUserId: userId,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getUserPostsForUser(
    userId: string,
    accountId: string,
    targetUserId: string,
    queryDto: TwitterUserPostsDto,
  ) {
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    const { credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * (
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4
      ),
    })
    const query: XUserTimelineRequest = {
      startTime: queryDto.startTime,
      endTime: queryDto.endTime,
      sinceId: queryDto.sinceId,
      untilId: queryDto.untilId,
      paginationToken: queryDto.paginationToken,
      maxResults,
      exclude: queryDto.exclude || ['replies', 'retweets'],
      mediaFields: ['url', 'preview_image_url', 'variants'],
      expansions: ['attachments.media_keys', 'author_id'],
      userFields: ['id', 'name', 'username', 'profile_image_url', 'verified'],
    }
    const response = await this.twitterApiService.getUserPosts(
      targetUserId,
      credential.access_token,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getUserPosts',
      endpoint: 'GET /2/users/:id/tweets',
      resources: [
        ...this.collectPostReadResources(response.data),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        targetUserId,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getMyLikedPostsForUser(userId: string, accountId: string, queryDto: TwitterMyLikedPostsDto): Promise<XLikedPostsResponse> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * (
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4
      ),
    })
    const query: XLikedPostsRequest = {
      paginationToken: queryDto.paginationToken,
      maxResults,
      mediaFields: ['url', 'preview_image_url', 'variants'],
      expansions: ['attachments.media_keys', 'author_id'],
      userFields: ['id', 'name', 'username', 'profile_image_url', 'verified'],
    }
    const response = await this.twitterApiService.getLikedPosts(
      credential.access_token,
      account.uid!,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getMyLikedPosts',
      endpoint: 'GET /2/users/:id/liked_tweets',
      resources: [
        ...this.collectPostReadResources(response.data),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        targetUserId: account.uid,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getMyPostsForUser(
    userId: string,
    accountId: string,
    queryDto: TwitterMyPostsDto,
  ) {
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * (
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4
      ),
    })
    const query: XUserTimelineRequest = {
      startTime: queryDto.startTime,
      endTime: queryDto.endTime,
      sinceId: queryDto.sinceId,
      untilId: queryDto.untilId,
      paginationToken: queryDto.paginationToken,
      maxResults,
      exclude: queryDto.exclude || ['replies', 'retweets'],
      mediaFields: ['url', 'preview_image_url', 'variants'],
      expansions: ['attachments.media_keys', 'author_id'],
      userFields: ['id', 'name', 'username', 'profile_image_url', 'verified'],
    }
    const response = await this.twitterApiService.getUserPosts(
      account.uid!,
      credential.access_token,
      query,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getMyPosts',
      endpoint: 'GET /2/users/:id/tweets',
      resources: [
        ...this.collectPostReadResources(response.data),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        targetUserId: account.uid,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getTweetDetail(
    accountId: string,
    tweetId: string,
  ): Promise<XGetPostDetailResponse | null> {
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount:
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4,
    })
    const credential = await this.authorize(accountId)
    const response = await this.twitterApiService.getPostDetail(
      credential.access_token,
      tweetId,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getTweetDetail',
      endpoint: 'GET /2/tweets/:id',
      resources: [
        ...this.collectPostReadResources(response.data ? [response.data] : []),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        postId: tweetId,
      },
    })
    return response
  }

  async getTweetDetailForUser(
    userId: string,
    accountId: string,
    tweetId: string,
  ) {
    const { credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount:
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4,
    })
    const response = await this.twitterApiService.getPostDetail(
      credential.access_token,
      tweetId,
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getTweetDetail',
      endpoint: 'GET /2/tweets/:id',
      resources: [
        ...this.collectPostReadResources(response.data ? [response.data] : []),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        tweetId,
      },
    })
    return {
      ...response,
      tweetId,
      tweetUrl: this.buildTweetUrl(tweetId),
    }
  }

  async getTweetConversation(userId: string, accountId: string, queryDto: TwitterTweetListDto): Promise<XSearchTweetsResponse> {
    return await this.searchTweets(userId, accountId, {
      ...queryDto,
      query: `conversation_id:${queryDto.tweetId}`,
    })
  }

  async getQuotedPosts(userId: string, accountId: string, queryDto: TwitterTweetListDto): Promise<XTweetListResponse> {
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    const { credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * (
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4
      ),
    })
    const response = await this.twitterApiService.getQuotedPosts(
      credential.access_token,
      queryDto.tweetId,
      this.buildTweetListQuery(queryDto),
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getQuotedPosts',
      endpoint: 'GET /2/tweets/:id/quote_tweets',
      resources: [
        ...this.collectPostReadResources(response.data),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        tweetId: queryDto.tweetId,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getReposts(userId: string, accountId: string, queryDto: TwitterTweetListDto): Promise<XTweetListResponse> {
    const maxResults = this.parseMaxResults(queryDto.maxResults)
    const { credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: maxResults * (
        this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Post)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.User)
        + this.twitterBillingService.getReadChargeAmount(TwitterReadResourceType.Media) * 4
      ),
    })
    const response = await this.twitterApiService.getReposts(
      credential.access_token,
      queryDto.tweetId,
      this.buildTweetListQuery(queryDto),
    )
    await this.twitterBillingService.chargeReadResources({
      accountId,
      operation: 'getReposts',
      endpoint: 'GET /2/tweets/:id/retweets',
      resources: [
        ...this.collectPostReadResources(response.data),
        ...this.collectUserReadResources(response.includes?.users),
        ...this.collectMediaReadResources(response.includes?.media),
      ],
      metadata: {
        tweetId: queryDto.tweetId,
        requestedMaxResults: maxResults,
      },
    })
    return response
  }

  async getRepostedBy(userId: string, accountId: string, queryDto: TwitterTweetListDto): Promise<XUserListResponse> {
    return await this.getPostUsers(userId, accountId, queryDto, 'getRepostedBy', 'GET /2/tweets/:id/retweeted_by')
  }

  async getLikingUsers(userId: string, accountId: string, queryDto: TwitterTweetListDto): Promise<XUserListResponse> {
    return await this.getPostUsers(userId, accountId, queryDto, 'getLikingUsers', 'GET /2/tweets/:id/liking_users')
  }

  async repostPost(
    userId: string,
    accountId: string,
    tweetId: string,
  ): Promise<XRePostResponse | null> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getWriteChargeAmount(
        TwitterWriteChargeType.InteractionCreate,
      ),
    })
    const response = await this.twitterApiService.repostPost(
      account.uid!,
      credential.access_token,
      tweetId,
    )
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: 'repostPost',
      endpoint: 'POST /2/users/:id/retweets',
      chargeType: TwitterWriteChargeType.InteractionCreate,
      metadata: {
        tweetId,
      },
    })
    return response
  }

  async undoRepostPost(
    userId: string,
    accountId: string,
    tweetId: string,
  ): Promise<XRePostResponse | null> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getWriteChargeAmount(
        TwitterWriteChargeType.InteractionDelete,
      ),
    })
    const response = await this.twitterApiService.undoRepostPost(
      account.uid!,
      credential.access_token,
      tweetId,
    )
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: 'undoRepostPost',
      endpoint: 'DELETE /2/users/:id/retweets/:tweetId',
      chargeType: TwitterWriteChargeType.InteractionDelete,
      metadata: {
        tweetId,
      },
    })
    return response
  }

  async likePost(
    userId: string,
    accountId: string,
    tweetId: string,
  ): Promise<XLikePostResponse | null> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getWriteChargeAmount(
        TwitterWriteChargeType.InteractionCreate,
      ),
    })
    const response = await this.twitterApiService.likePost(
      account.uid,
      credential.access_token,
      tweetId,
    )
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: 'likePost',
      endpoint: 'POST /2/users/:id/likes',
      chargeType: TwitterWriteChargeType.InteractionCreate,
      metadata: {
        tweetId,
      },
    })
    return response
  }

  async unlikePost(
    userId: string,
    accountId: string,
    tweetId: string,
  ): Promise<XLikePostResponse | null> {
    const { account, credential } = await this.getAuthorizedTwitterAccount(userId, accountId)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getWriteChargeAmount(
        TwitterWriteChargeType.InteractionDelete,
      ),
    })
    const response = await this.twitterApiService.unlikePost(
      account.uid,
      credential.access_token,
      tweetId,
    )
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: 'unlikePost',
      endpoint: 'DELETE /2/users/:id/likes/:tweetId',
      chargeType: TwitterWriteChargeType.InteractionDelete,
      metadata: {
        tweetId,
      },
    })
    return response
  }

  public async replyPost(userId: string, accountId: string, tweetId: string, text: string):
  Promise<XCreatePostResponse | null> {
    await this.getTwitterAccount(userId, accountId)
    const chargeType = this.getCreatePostChargeType(text)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getWriteChargeAmount(chargeType),
    })
    const credential = await this.authorize(accountId)
    const post: XCreatePostRequest = {
      text,
      reply: {
        inReplyToTweetId: tweetId,
      },
    }
    const response = await this.twitterApiService.createPost(credential.access_token, post)
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: 'replyPost',
      endpoint: 'POST /2/tweets',
      chargeType,
      metadata: {
        postId: response.data?.id,
        replyToTweetId: tweetId,
      },
    })
    return response
  }

  public async quotePost(userId: string, accountId: string, tweetId: string, text: string):
  Promise<XCreatePostResponse | null> {
    await this.getTwitterAccount(userId, accountId)
    const chargeType = this.getCreatePostChargeType(text)
    await this.twitterBillingService.ensureSufficientBalance({
      accountId,
      amount: this.twitterBillingService.getWriteChargeAmount(chargeType),
    })
    const credential = await this.authorize(accountId)
    const post: XCreatePostRequest = {
      text,
      quoteTweetId: tweetId,
    }
    const response = await this.twitterApiService.createPost(credential.access_token, post)
    await this.twitterBillingService.chargeWriteOperation({
      accountId,
      operation: 'quotePost',
      endpoint: 'POST /2/tweets',
      chargeType,
      metadata: {
        postId: response.data?.id,
        quoteTweetId: tweetId,
      },
    })
    return response
  }

  async getAccessTokenStatus(accountId: string): Promise<number> {
    await this.getLocalAccountById(accountId)
    try {
      await this.authorize(accountId)
      this.updateAccountStatus(accountId, 1)
      return 1
    }
    catch (error) {
      if (!(error instanceof PlatformAuthExpiredException)) {
        throw error
      }
      this.logger.warn(`Twitter authorization is expired for accountId: ${accountId}, ${getErrorMessage(error)}`)
      this.updateAccountStatus(accountId, 0)
      return 0
    }
  }

  /**
   * Get work link metadata.
   * @param accountType
   * @param workLink
   * @param dataId
   * @returns
   */
  override async getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string, _accountId?: string): Promise<{
    dataId: string
    uniqueId: string
    type: PublishType
    videoType?: 'short' | 'long'
    resolvedUrl?: string
  }> {
    const resolvedUrl = await this.normalizeTwitterWorkLink(workLink)
    const tweetId = this.parseTwitterUrl(resolvedUrl)
    const resolvedDataId = tweetId || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: resolvedDataId,
      uniqueId: `${accountType}_${resolvedDataId}`,
      type: PublishType.VIDEO,
      videoType: 'short',
      resolvedUrl,
    }
  }

  override async validateOwnedWorkLink(
    accountType: AccountType,
    accountId: string,
    workLink: string,
  ): Promise<ValidatedWorkInfo> {
    const resolvedUrl = await this.normalizeTwitterWorkLink(workLink)
    const tweetId = this.parseTwitterUrl(resolvedUrl)
    if (!tweetId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    const account = await this.getLocalAccountById(accountId)
    const detail = await this.getTweetDetail(accountId, tweetId)
    if (!detail?.data?.authorId) {
      throw new AppException(ResponseCode.WorkDetailNotFound)
    }
    if (!account?.uid || detail.data.authorId !== account.uid) {
      throw new AppException(ResponseCode.WorkNotBelongToAccount)
    }

    const workDetail = this.toWorkDetailInfo(tweetId, detail)
    return {
      dataId: tweetId,
      uniqueId: `${accountType}_${tweetId}`,
      type: workDetail.type,
      videoType: workDetail.videoType,
      resolvedUrl,
      workDetail,
    }
  }

  override async getWorkDetail(accountId: string, dataId: string): Promise<WorkDetailInfo | null> {
    const detail = await this.getTweetDetail(accountId, dataId)
    if (!detail?.data) {
      return null
    }

    return this.toWorkDetailInfo(dataId, detail)
  }

  override async verifyWorkOwnership(accountId: string, dataId: string): Promise<boolean> {
    const account = await this.getLocalAccountById(accountId)
    try {
      const detail = await this.getTweetDetail(accountId, dataId)
      if (!detail) {
        throw new AppException(ResponseCode.ChannelAccessTokenFailed)
      }
      if (!detail.data?.authorId) {
        throw new AppException(ResponseCode.WorkDetailNotFound)
      }
      if (!account?.uid || detail.data.authorId !== account.uid) {
        throw new AppException(ResponseCode.WorkNotBelongToAccount)
      }
      return true
    }
    catch (error) {
      if (error instanceof TwitterError && error.cause.httpStatus === 404) {
        throw new AppException(ResponseCode.WorkDetailNotFound)
      }
      throw error
    }
  }

  private async normalizeTwitterWorkLink(workLink: string): Promise<string> {
    let url: URL
    try {
      url = new URL(workLink)
    }
    catch {
      return workLink
    }

    const hostname = url.hostname.replace('www.', '').replace('mobile.', '')
    if (hostname === 't.co') {
      return await this.resolveRedirectUrl(workLink, { throwOnFailure: true })
    }
    return workLink
  }

  /**
   * Parse a Twitter/X URL and extract the tweet ID.
   * Supported URL formats:
   * - https://twitter.com/username/status/TWEET_ID
   * - https://x.com/username/status/TWEET_ID
   * - https://mobile.twitter.com/username/status/TWEET_ID
   * - https://t.co/SHORT_CODE
   * @param workLink Twitter work link
   * @returns tweetId or null
   */
  private parseTwitterUrl(workLink: string): string | null {
    const trimmedWorkLink = workLink.trim()
    if (/^\d+$/.test(trimmedWorkLink)) {
      return trimmedWorkLink
    }

    let url: URL
    try {
      url = new URL(trimmedWorkLink)
    }
    catch {
      return null
    }

    const hostname = url.hostname.replace('www.', '').replace('mobile.', '')

    if (hostname === 'twitter.com' || hostname === 'x.com') {
      // https://twitter.com/username/status/TWEET_ID
      const statusMatch = url.pathname.match(/\/status\/(\d+)/)
      if (statusMatch) {
        return statusMatch[1]
      }

      const webStatusMatch = url.pathname.match(/\/i\/web\/status\/(\d+)/)
      if (webStatusMatch) {
        return webStatusMatch[1]
      }
    }

    return null
  }

  private toWorkDetailInfo(dataId: string, detail: XGetPostDetailResponse): WorkDetailInfo {
    return {
      dataId,
      desc: detail.data?.text,
      videoUrl: `https://x.com/i/web/status/${dataId}`,
      publishTime: detail.data?.createdAt ? new Date(detail.data.createdAt) : undefined,
      type: PublishType.VIDEO,
      videoType: 'short',
      rawData: detail.data as unknown as Record<string, unknown>,
    }
  }
}

import { createHash, randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { AccountStatus, AccountType, NewAccount, PublishType } from '@yikart/aitoearn-server-client'
import { AppException, getErrorMessage, ResponseCode } from '@yikart/common'
import { RedisService } from '@yikart/redis'
import { isAxiosError } from 'axios'
import { v4 as uuidV4 } from 'uuid'
import { chunkedDownloadFile, fileUrlToBlob, getFileSizeFromUrl, getFileTypeFromUrl } from '../../../../common/utils/file.util'
import { getCurrentTimestamp } from '../../../../common/utils/time.util'
import { config } from '../../../../config'
import { RelayAuthException } from '../../../relay/relay-auth.exception'
import { ChannelRedisKeys } from '../../channel.constants'
import { XMediaCategory, XMediaType } from '../../libs/twitter/twitter.enum'
import { TwitterOAuthCredential, XChunkedMediaUploadRequest, XCreatePostRequest, XCreatePostResponse, XLikePostResponse, XMediaUploadInitRequest, XMediaUploadResponse, XPostDetailResponse, XRePostResponse, XUserTimelineRequest } from '../../libs/twitter/twitter.interfaces'
import { TwitterService as TwitterApiService } from '../../libs/twitter/twitter.service'
import { PlatformBaseService } from '../base.service'
import { ChannelAccountService } from '../channel-account.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { TWITTER_TIME_CONSTANTS } from './constants'
import { UserTimelineDto } from './twitter.dto'
import { TwitterOAuthTaskInfo } from './twitter.interfaces'

@Injectable()
export class TwitterService extends PlatformBaseService {
  protected override readonly platform: AccountType = AccountType.TWITTER
  protected override readonly logger = new Logger(TwitterService.name)
  private readonly redisService: RedisService
  private readonly twitterApiService: TwitterApiService
  private readonly channelAccountService: ChannelAccountService
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
    'mute.read', // Accounts you’ve muted.
    'mute.write', // Mute and unmute accounts for you.
    'like.read', // Tweets you’ve liked and likes you can view.
    'like.write', // Like and un-like Tweets for you.
    'list.read', // Lists, list members, and list followers of lists you’ve created or are a member of, including private lists.
    'list.write', // Create and manage Lists for you.
    'block.read', // Accounts you’ve blocked.
    'block.write', // Block and unblock accounts for you.
    'bookmark.read', // Get Bookmarked Tweets from an authenticated user.
    'bookmark.write', // Bookmark and remove Bookmarks from Tweets.
    'media.write', // Upload media.
  ]

  constructor(
    redisService: RedisService,
    twitterApiService: TwitterApiService,
    channelAccountService: ChannelAccountService,
  ) {
    super()
    this.redisService = redisService
    this.twitterApiService = twitterApiService
    this.channelAccountService = channelAccountService
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

  private async authorize(
    accountId: string,
  ): Promise<TwitterOAuthCredential> {
    await this.ensureLocalAccount(accountId)
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
        credential.refresh_token,
      )
      if (!refreshedToken) {
        throw new PlatformAuthExpiredException(this.platform, accountId)
      }
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

  private async refreshOAuthCredential(refresh_token: string) {
    try {
      const credential
        = await this.twitterApiService.refreshOAuthCredential(refresh_token)
      if (!credential) {
        this.logger.error(`Failed to refresh access token`)
        return null
      }
      return credential
    }
    catch (error) {
      if (isAxiosError(error) && error.response) {
        this.logger.error(`Error response: ${JSON.stringify(error.response.data)}`)
        const errorData = error.response.data as Record<string, unknown> | undefined
        throw new Error((errorData?.['error'] as string) || 'Failed to refresh access token')
      }
      this.logger.error(`Error: ${getErrorMessage(error)}`)
      throw new Error('Failed to refresh access token')
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
    const codeVerifier = randomBytes(64).toString('hex')
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')
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
    const authorizeURL = this.twitterApiService.generateAuthorizeURL(
      scopes,
      state,
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
        message: '授权任务不存在或已过期',
      }
    }

    // 延长授权任务时间
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
        message: '获取访问令牌失败',
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
        message: `获取用户信息失败: ${JSON.stringify(userRes.errors)}`,
      }
    }

    const newAccountData = new NewAccount({
      userId: authTaskInfo.userId,
      type: AccountType.TWITTER,
      uid: userRes.data.id,
      account: userRes.data.username,
      avatar: userRes.data.profile_image_url,
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
        message: '创建账号失败',
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
        message: '保存访问令牌失败',
      }
    }
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
        message: '更新任务状态失败',
      }
    }
    return {
      status: 1,
      message: '授权成功',
      accountId: accountInfo.id,
      callbackUrl: authTaskInfo.callbackUrl,
      callbackMethod: authTaskInfo.callbackMethod,
      taskId: state,
      nickname: userRes.data.name,
      avatar: userRes.data.profile_image_url,
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
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.warn(`No access token found for accountId: ${accountId}`)
      return null
    }
    return await this.twitterApiService.getUserInfo(credential.access_token)
  }

  public async followUser(userId: string, targetXUserId: string) {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return false
    }
    return await this.twitterApiService.followUser(
      credential.access_token,
      targetXUserId,
    )
  }

  public async initMediaUpload(userId: string, req: XMediaUploadInitRequest) {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    return await this.twitterApiService.initMediaUpload(credential.access_token, req)
  }

  public async chunkedMediaUploadRequest(userId: string, req: XChunkedMediaUploadRequest) {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    return await this.twitterApiService.chunkedMediaUploadRequest(credential.access_token, req)
  }

  public async finalizeMediaUpload(userId: string, mediaId: string) {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    return await this.twitterApiService.finalizeMediaUpload(credential.access_token, mediaId)
  }

  public async createPost(userId: string, post: XCreatePostRequest) {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    return await this.twitterApiService.createPost(credential.access_token, post)
  }

  override async deletePost(userId: string, tweetId: string): Promise<boolean> {
    const credential = await this.authorize(userId)
    const result = await this.twitterApiService.deletePost(
      credential.access_token,
      tweetId,
    )
    return result.data.deleted
  }

  public async getMediaUploadStatus(
    userId: string,
    mediaId: string,
  ): Promise<XMediaUploadResponse> {
    const credential = await this.authorize(userId)
    return await this.twitterApiService.getMediaStatus(
      credential.access_token,
      mediaId,
    )
  }

  async publishPost(
    accountId: string,
    imgUrlList: string[] | null,
    videoUrl: string | null,
    text: string,
  ) {
    this.logger.log(`dopub, ${accountId}, ${videoUrl}, ${text}`)
    const twitterMediaIDs: string[] = []
    if (imgUrlList) {
      for (const imgUrl of imgUrlList) {
        const imgBlob = await fileUrlToBlob(imgUrl)
        if (!imgBlob) {
          this.logger.error('图片下载失败')
          return null
        }
        this.logger.log('imgBlob', imgBlob.blob.size)
        const fileName = getFileTypeFromUrl(imgUrl)
        const ext = fileName.split('.').pop()?.toLowerCase()
        const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
        const initUploadReq: XMediaUploadInitRequest = {
          media_type: mimeType as XMediaType,
          total_bytes: imgBlob.blob.size,
          media_category: XMediaCategory.TWEET_IMAGE,
          shared: false,
        }
        this.logger.log('initMediaUpload', initUploadReq)
        const initUploadRes = await this.initMediaUpload(
          accountId,
          initUploadReq,
        )
        this.logger.log(initUploadRes)
        if (!initUploadRes || !initUploadRes.data.id) {
          this.logger.error('图片初始化上传失败')
          return null
        }
        const uploadReq: XChunkedMediaUploadRequest = {
          media_id: initUploadRes.data.id,
          media: await imgBlob.blob,
          segment_index: 0,
        }
        this.logger.log('chunkedMediaUploadRequest', uploadReq)
        const updateRes = await this.chunkedMediaUploadRequest(
          accountId,
          uploadReq,
        )
        this.logger.log(updateRes)
        if (!updateRes || !updateRes.data.expires_at) {
          this.logger.error('图片分片上传失败')
          return null
        }
        const finalizeUploadRes = await this.finalizeMediaUpload(
          accountId,
          initUploadRes.data.id,
        )
        this.logger.log(finalizeUploadRes)
        if (!finalizeUploadRes || !finalizeUploadRes.data.id) {
          this.logger.error('确认图片上传失败')
          return null
        }
        twitterMediaIDs.push(initUploadRes.data.id)
      }
    }

    if (videoUrl) {
      const fileName = getFileTypeFromUrl(videoUrl, true)
      const ext = fileName.split('.').pop()?.toLowerCase()
      const mimeType = ext === 'mp4' ? 'video/mp4' : `video/${ext}`

      const contentLength = await getFileSizeFromUrl(videoUrl)
      if (!contentLength) {
        this.logger.error('视频信息解析失败')
        return null
      }
      const initUploadReq: XMediaUploadInitRequest = {
        media_type: mimeType as XMediaType,
        total_bytes: contentLength,
        media_category: XMediaCategory.TWEET_VIDEO,
        shared: false,
      }

      const initUploadRes = await this.initMediaUpload(
        accountId,
        initUploadReq,
      )
      this.logger.log(`initMediaUpload: ${JSON.stringify(initUploadRes)}`)
      if (!initUploadRes || !initUploadRes.data.id) {
        this.logger.error('视频初始化上传失败')
        return null
      }
      const chunkSize = 4 * 1024 * 1024 // 5MB

      const totalParts = Math.ceil(contentLength / chunkSize)
      for (let partNumber = 0; partNumber < totalParts; partNumber++) {
        const start = partNumber * chunkSize
        const end = Math.min(start + chunkSize - 1, contentLength - 1)
        const range: [number, number] = [start, end]
        const videoBlob = await chunkedDownloadFile(videoUrl, range)
        if (!videoBlob) {
          this.logger.error('视频分片下载失败')
          return null
        }
        this.logger.log(`videoBlob ${partNumber}, ${videoBlob.length}, range: ${range}`)
        const uploadReq: XChunkedMediaUploadRequest = {
          media: new Blob([videoBlob]),
          media_id: initUploadRes.data.id,
          segment_index: partNumber,
        }
        this.logger.log(`chunkedMediaUploadRequest: ${JSON.stringify(uploadReq)}`)
        const upload = await this.chunkedMediaUploadRequest(
          accountId,
          uploadReq,
        )
        this.logger.log(`chunkedMediaUploadRequest: ${JSON.stringify(upload)}`)
        if (!upload || !upload.data.expires_at) {
          this.logger.error('视频分片上传失败')
          return null
        }
      }
      const finalizeUploadRes = await this.finalizeMediaUpload(
        accountId,
        initUploadRes.data.id,
      )
      this.logger.log(`finalizeMediaUpload: ${JSON.stringify(finalizeUploadRes)}`)
      if (!finalizeUploadRes || !finalizeUploadRes.data.id) {
        this.logger.error('确认视频上传完成失败')
        return null
      }
      twitterMediaIDs.push(initUploadRes.data.id)
    }
    this.logger.log(`twitterMediaIDs: ${twitterMediaIDs}`)
    const status = await this.getMediaUploadStatus(
      accountId,
      twitterMediaIDs[0],
    )
    this.logger.log(`getMediaUploadStatus: ${JSON.stringify(status)}`)
    return undefined
  }

  async getUserTimeline(
    accountId: string,
    userId: string,
    queryDto: UserTimelineDto,
  ) {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.warn(`No access token found for accountId: ${accountId}`)
      return null
    }
    const query: XUserTimelineRequest = {
      start_time: queryDto.startTime,
      end_time: queryDto.endTime,
      since_id: queryDto.sinceId,
      until_id: queryDto.untilId,
      max_results: queryDto.maxResults ? Number.parseInt(queryDto.maxResults) : 10,
    }
    return await this.twitterApiService.getUserTimeline(
      userId,
      credential.access_token,
      query,
    )
  }

  async getUserPosts(
    accountId: string,
    userId: string,
    queryDto: UserTimelineDto,
  ) {
    const credential = await this.authorize(accountId)
    if (!credential) {
      this.logger.warn(`No access token found for accountId: ${accountId}`)
      return null
    }
    const query: XUserTimelineRequest = {
      'start_time': queryDto.startTime,
      'end_time': queryDto.endTime,
      'since_id': queryDto.sinceId,
      'until_id': queryDto.untilId,
      'max_results': queryDto.maxResults ? Number.parseInt(queryDto.maxResults) : 10,
      'exclude': 'replies,retweets',
      'media.fields': 'url,preview_image_url,variants',
      'expansions': 'attachments.media_keys',
    }
    return await this.twitterApiService.getUserPosts(
      userId,
      credential.access_token,
      query,
    )
  }

  async getTweetDetail(
    userId: string,
    tweetId: string,
  ): Promise<XPostDetailResponse | null> {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    return await this.twitterApiService.getPostDetail(
      credential.access_token,
      tweetId,
    )
  }

  async repost(
    userId: string,
    tweetId: string,
  ): Promise<XRePostResponse | null> {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    return await this.twitterApiService.repost(
      userId,
      credential.access_token,
      tweetId,
    )
  }

  async unRepost(
    userId: string,
    tweetId: string,
  ): Promise<XRePostResponse | null> {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    return await this.twitterApiService.unRepost(
      userId,
      credential.access_token,
      tweetId,
    )
  }

  async likePost(
    userId: string,
    tweetId: string,
  ): Promise<XLikePostResponse | null> {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    return await this.twitterApiService.likePost(
      userId,
      credential.access_token,
      tweetId,
    )
  }

  async unlikePost(
    userId: string,
    tweetId: string,
  ): Promise<XLikePostResponse | null> {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    return await this.twitterApiService.unlikePost(
      userId,
      credential.access_token,
      tweetId,
    )
  }

  public async replyPost(userId: string, tweetId: string, text: string):
  Promise<XCreatePostResponse | null> {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    const post: XCreatePostRequest = {
      text,
      reply: {
        in_reply_to_tweet_id: tweetId,
      },
    }
    return await this.twitterApiService.createPost(credential.access_token, post)
  }

  public async quotePost(userId: string, tweetId: string, text: string):
  Promise<XCreatePostResponse | null> {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    const post: XCreatePostRequest = {
      text,
      quote_tweet_id: tweetId,
    }
    return await this.twitterApiService.createPost(credential.access_token, post)
  }

  async getAccessTokenStatus(accountId: string): Promise<number> {
    await this.ensureLocalAccount(accountId)
    const credential = await this.getOAuth2Credential(accountId)
    if (!credential) {
      this.logger.warn(`No access token found for twitter accountId: ${accountId}`)
      this.updateAccountStatus(accountId, 0)
      return 0
    }
    this.updateAccountStatus(accountId, 1)
    return 1
  }

  async deleteTweet(userId: string, tweetId: string): Promise<{ success: boolean } | null> {
    const credential = await this.authorize(userId)
    if (!credential) {
      this.logger.warn(`No access token found for userId: ${userId}`)
      return null
    }
    const resp = await this.twitterApiService.deleteTweet(credential.access_token, tweetId)
    return { success: resp.data.deleted }
  }

  /**
   * 获取作品信息
   * @param accountType
   * @param workLink
   * @param dataId
   * @returns
   */
  async getWorkLinkInfo(accountType: AccountType, workLink: string, dataId?: string): Promise<{
    dataId: string
    uniqueId: string
    type: PublishType
    videoType?: 'short' | 'long'
  }> {
    const tweetId = this.parseTwitterUrl(workLink)
    const resolvedDataId = tweetId || dataId || ''
    if (!resolvedDataId) {
      throw new AppException(ResponseCode.InvalidWorkLink)
    }

    return {
      dataId: resolvedDataId,
      uniqueId: `${accountType}_${resolvedDataId}`,
      type: PublishType.VIDEO,
      videoType: 'short',
    }
  }

  /**
   * 解析 Twitter/X URL，提取推文 ID
   * 支持的 URL 格式：
   * - https://twitter.com/username/status/TWEET_ID
   * - https://x.com/username/status/TWEET_ID
   * - https://mobile.twitter.com/username/status/TWEET_ID
   * - https://t.co/SHORT_CODE
   * @param workLink Twitter 链接
   * @returns tweetId 或 null
   */
  private parseTwitterUrl(workLink: string): string | null {
    let url: URL
    try {
      url = new URL(workLink)
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
    }
    else if (hostname === 't.co') {
      // 短链接，返回短码作为 ID
      return url.pathname.slice(1).split(/[?&#/]/)[0] || null
    }

    return null
  }
}

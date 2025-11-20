import { createHash, randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { AccountStatus, AccountType, NewAccount } from '@yikart/aitoearn-server-client'
import { RedisService } from '@yikart/redis'
import { Model } from 'mongoose'
import { v4 as uuidV4 } from 'uuid'
import { chunkedDownloadFile, fileUrlToBlob, getCurrentTimestamp, getFileSizeFromUrl, getFileTypeFromUrl } from '../../../common'
import { AccountService } from '../../../core/account/account.service'
import { OAuth2Credential } from '../../../libs/database/schema/oauth2Credential.schema'
import { XMediaCategory, XMediaType } from '../../../libs/twitter/twitter.enum'
import { TwitterOAuthCredential, XChunkedMediaUploadRequest, XCreatePostRequest, XCreatePostResponse, XLikePostResponse, XMediaUploadInitRequest, XMediaUploadResponse, XPostDetailResponse, XRePostResponse, XUserTimelineRequest } from '../../../libs/twitter/twitter.interfaces'
import { TwitterService as TwitterApiService } from '../../../libs/twitter/twitter.service'
import { PlatformBaseService } from '../base.service'
import { PlatformAuthExpiredException } from '../platform.exception'
import { TWITTER_TIME_CONSTANTS, TwitterRedisKeys } from './constants'
import { UserTimelineDto } from './dto/twitter.dto'
import { TwitterOAuthTaskInfo } from './twitter.interfaces'

@Injectable()
export class TwitterService extends PlatformBaseService {
  protected override readonly platform: string = AccountType.TWITTER
  protected override readonly logger = new Logger(TwitterService.name)
  private readonly redisService: RedisService
  private readonly twitterApiService: TwitterApiService
  private readonly accountService: AccountService
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
    accountService: AccountService,
    @InjectModel(OAuth2Credential.name)
    private OAuth2CredentialModel: Model<OAuth2Credential>,
  ) {
    super()
    this.redisService = redisService
    this.twitterApiService = twitterApiService
    this.accountService = accountService
  }

  private async saveOAuthCredential(accountId: string, accessTokenInfo: TwitterOAuthCredential) {
    accessTokenInfo.expires_in = accessTokenInfo.expires_in + getCurrentTimestamp() - TWITTER_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    const cached = await this.redisService.setJson(
      TwitterRedisKeys.getAccessTokenKey(accountId),
      accessTokenInfo,
    )
    const persistResult = await this.OAuth2CredentialModel.updateOne({
      accountId,
      platform: this.platform,
    }, {
      accessToken: accessTokenInfo.access_token,
      refreshToken: accessTokenInfo.refresh_token,
      accessTokenExpiresAt: accessTokenInfo.expires_in,
    }, {
      upsert: true,
    })
    const saved = cached && (persistResult.modifiedCount > 0 || persistResult.upsertedCount > 0)
    return saved
  }

  private async getOAuth2Credential(accountId: string): Promise<TwitterOAuthCredential | null> {
    let credential = await this.redisService.getJson<TwitterOAuthCredential>(
      TwitterRedisKeys.getAccessTokenKey(accountId),
    )
    if (!credential) {
      const oauth2Credential = await this.OAuth2CredentialModel.findOne({
        accountId,
        platform: this.platform,
      })
      if (!oauth2Credential) {
        throw new PlatformAuthExpiredException(this.platform)
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
    const credential = await this.getOAuth2Credential(accountId)
    const now = getCurrentTimestamp()
    if (now >= credential.expires_in) {
      this.logger.debug(
        `Access token for accountId: ${accountId} is expired, refreshing...`,
      )
      const refreshedToken = await this.refreshOAuthCredential(
        credential.refresh_token,
      )
      if (!refreshedToken) {
        throw new PlatformAuthExpiredException(this.platform)
      }
      credential.access_token = refreshedToken.access_token
      credential.refresh_token = refreshedToken.refresh_token
      credential.expires_in = refreshedToken.expires_in
      const saved = await this.saveOAuthCredential(accountId, credential)
      if (!saved) {
        throw new PlatformAuthExpiredException(this.platform)
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
      if (error.response) {
        this.logger.error(`Error response: ${JSON.stringify(error.response.data)}`)
        throw new Error(error.response.data.error || 'Failed to refresh access token')
      }
      this.logger.error(`Error: ${error.message}`)
      throw new Error('Failed to refresh access token')
    }
  }

  async generateAuthorizeURL(userId: string, scopes?: string[], spaceId = '') {
    const taskId = uuidV4()
    const codeVerifier = randomBytes(64).toString('hex')
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')
    const state = randomBytes(32).toString('hex')
    const success = await this.redisService.setJson(
      TwitterRedisKeys.getAuthTaskKey(state),
      { state, status: 0, userId, codeVerifier, taskId, spaceId },
      TWITTER_TIME_CONSTANTS.AUTH_TASK_EXPIRE,
    )
    scopes = scopes || this.defaultScopes
    const authorizeURL = this.twitterApiService.generateAuthorizeURL(
      scopes,
      state,
      codeChallenge,
    )
    return success ? { url: authorizeURL, taskId: state, state } : null
  }

  async getOAuth2TaskInfo(state: string) {
    return await this.redisService.getJson<TwitterOAuthTaskInfo>(
      TwitterRedisKeys.getAuthTaskKey(state),
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
      TwitterRedisKeys.getAuthTaskKey(state),
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
    const userProfile = await this.twitterApiService.getUserInfo(
      credential.access_token,
    )
    this.logger.log(userProfile)

    // 创建账号数据
    const newAccountData = new NewAccount({
      userId: authTaskInfo.userId,
      type: AccountType.TWITTER,
      uid: userProfile.id,
      account: userProfile.username,
      avatar: userProfile.profile_image_url,
      nickname: userProfile.name,
      lastStatsTime: new Date(),
      loginTime: new Date(),
      groupId: authTaskInfo.spaceId,
      status: AccountStatus.NORMAL,
    })

    const accountInfo = await this.accountService.createAccount(
      authTaskInfo.userId,
      {
        type: AccountType.TWITTER,
        uid: userProfile.id,
      },
      newAccountData,
    )
    if (!accountInfo) {
      this.logger.error(
        `Failed to create account for userId: ${authTaskInfo.userId}, twitterId: ${userProfile.id}`,
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
      TwitterRedisKeys.getAuthTaskKey(state),
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
        TwitterRedisKeys.getAccessTokenKey(accountId),
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
    const credential = await this.getOAuth2Credential(accountId)
    if (!credential) {
      this.logger.warn(`No access token found for twitter accountId: ${accountId}`)
      return 0
    }
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
}

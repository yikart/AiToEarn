import { createHash, randomBytes } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import { v4 as uuidV4 } from 'uuid'
import { getCurrentTimestamp } from '@/common'
import { config } from '@/config'
import { AccountService } from '@/core/account/account.service'
import { RedisService } from '@/libs'
import { TwitterOAuthCredential, XChunkedMediaUploadRequest, XCreatePostRequest, XMediaUploadInitRequest } from '@/libs/twitter/twitter.interfaces'
import { TwitterService as TwitterApiService } from '@/libs/twitter/twitter.service'
import { AccountType, NewAccount } from '@/transports/account/common'
import { TWITTER_TIME_CONSTANTS, TwitterRedisKeys } from './constants'
import { TwitterOAuthTaskInfo } from './twitter.interfaces'

@Injectable()
export class TwitterService {
  private prefix = ''
  private readonly redisService: RedisService
  private readonly twitterApiService: TwitterApiService
  private readonly accountService: AccountService
  private readonly logger = new Logger(TwitterService.name)
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
  ) {
    this.prefix = config.nats.prefix
    this.redisService = redisService
    this.twitterApiService = twitterApiService
    this.accountService = accountService
  }

  private async authorize(
    accountId: string,
  ): Promise<TwitterOAuthCredential | null> {
    const credential = await this.redisService.get<TwitterOAuthCredential>(
      TwitterRedisKeys.getAccessTokenKey(accountId),
    )
    if (!credential) {
      this.logger.warn(`No access token found for accountId: ${accountId}`)
      return null
    }
    const now = getCurrentTimestamp()
    const tokenExpiredAt = now + credential.expires_in
    const requestTime
      = tokenExpiredAt - TWITTER_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    if (requestTime <= now) {
      this.logger.debug(
        `Access token for accountId: ${accountId} is expired, refreshing...`,
      )
      const refreshedToken = await this.refreshOAuthCredential(
        credential.refresh_token,
      )
      if (!refreshedToken) {
        this.logger.error(
          `Failed to refresh access token for accountId: ${accountId}`,
        )
        return null
      }
      credential.access_token = refreshedToken.access_token
      credential.refresh_token = refreshedToken.refresh_token
      credential.expires_in = refreshedToken.expires_in
      const saved = await this.saveOAuthCredential(accountId, credential)
      if (!saved) {
        this.logger.error(
          `Failed to save refreshed access token for accountId: ${accountId}`,
        )
        return null
      }
      return credential
    }
    return credential
  }

  private async refreshOAuthCredential(refresh_token: string) {
    const credential
      = await this.twitterApiService.refreshOAuthCredential(refresh_token)
    if (!credential) {
      this.logger.error(`Failed to refresh access token`)
      return null
    }
    return credential
  }

  async generateAuthorizeURL(userId: string, scopes?: string[]) {
    const taskId = uuidV4()
    const codeVerifier = randomBytes(64).toString('hex')
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')
    const state = randomBytes(32).toString('hex')
    const success = await this.redisService.setKey<TwitterOAuthTaskInfo>(
      TwitterRedisKeys.getAuthTaskKey(state),
      { state, status: 0, userId, codeVerifier, taskId },
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
    return await this.redisService.get<TwitterOAuthTaskInfo>(
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
      return null
    }

    // 延长授权任务时间
    void this.redisService.setPexire(
      TwitterRedisKeys.getAuthTaskKey(state),
      TWITTER_TIME_CONSTANTS.AUTH_TASK_EXTEND,
    )

    const credential = await this.twitterApiService.getOAuthCredential(
      code,
      authTaskInfo.codeVerifier,
    )
    if (!credential) {
      this.logger.error(`Failed to get access token for state: ${state}`)
      return null
    }

    // fetch twitter user profile
    const userProfile = await this.twitterApiService.getUserInfo(
      credential.access_token,
    )

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
    })

    const accountInfo = await this.accountService.createAccount(
      {
        userId: authTaskInfo.userId,
        type: AccountType.TWITTER,
        uid: userProfile.id,
      },
      newAccountData,
    )
    if (!accountInfo) {
      this.logger.error(
        `Failed to create account for userId: ${authTaskInfo.userId}, twitterId: ${userProfile.id}`,
      )
      return null
    }
    const tokenSaved = await this.saveOAuthCredential(
      accountInfo.id,
      credential,
    )
    if (!tokenSaved) {
      this.logger.error(
        `Failed to save access token for accountId: ${accountInfo.id}`,
      )
      return null
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
      return null
    }
    return accountInfo
  }

  private async saveOAuthCredential(
    accountId: string,
    tokenInfo: TwitterOAuthCredential,
  ): Promise<boolean> {
    const expireTime
      = tokenInfo.expires_in - TWITTER_TIME_CONSTANTS.TOKEN_REFRESH_MARGIN
    return await this.redisService.setKey(
      TwitterRedisKeys.getAccessTokenKey(accountId),
      tokenInfo,
      expireTime,
    )
  }

  private async updateAuthTaskStatus(
    state: string,
    authTaskInfo: TwitterOAuthTaskInfo,
    accountId: string,
  ): Promise<boolean> {
    authTaskInfo.status = 1
    authTaskInfo.accountId = accountId

    return await this.redisService.setKey(
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
}

import { AccountType, ResponseCode } from '@yikart/common'
import { describe, expect, it, vi } from 'vitest'
import { TwitterService } from './twitter.service'

vi.mock('../../../../config', () => ({
  config: {
    channel: {
      twitter: {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        redirectUri: 'https://example.com/back',
        pricing: {
          read: { post: 0.5, user: 1, media: 0.5, list: 0.5 },
          write: {
            contentCreate: 1.5,
            contentCreateWithUrl: 20,
            interactionCreate: 1.5,
            interactionDelete: 1,
            contentManage: 0.5,
            bookmark: 0.5,
            mediaMetadata: 0.5,
          },
        },
      },
    },
    relay: false,
  },
}))

vi.mock('@yikart/channel-db', () => ({
  OAuth2CredentialRepository: class {},
}))

vi.mock('@yikart/mongodb', () => ({
  AccountRepository: class {},
}))

vi.mock('./twitter-billing.service', () => ({
  TwitterBillingService: class {},
  TwitterReadResourceType: {
    Post: 'post',
    User: 'user',
    Media: 'media',
    List: 'list',
  },
  TwitterWriteChargeType: {
    ContentCreate: 'content_create',
    ContentCreateWithUrl: 'content_create_with_url',
    InteractionCreate: 'interaction_create',
    InteractionDelete: 'interaction_delete',
    ContentManage: 'content_manage',
    Bookmark: 'bookmark',
    MediaMetadata: 'media_metadata',
  },
}))

function createService() {
  const redisService = {
    getJson: vi.fn(),
    setJson: vi.fn(),
    del: vi.fn(),
    expire: vi.fn(),
  }
  const twitterApiService = {
    refreshOAuthCredential: vi.fn(),
    getUserInfo: vi.fn(),
    getHomeTimeline: vi.fn(),
    getUserTimeline: vi.fn(),
    getUserPosts: vi.fn(),
    getFollowers: vi.fn(),
    getFollowing: vi.fn(),
    getBlocking: vi.fn(),
    getMuting: vi.fn(),
    getOwnedLists: vi.fn(),
    getFollowedLists: vi.fn(),
    getListMemberships: vi.fn(),
    getPinnedLists: vi.fn(),
    getLikedPosts: vi.fn(),
    searchRecentPosts: vi.fn(),
    getUserMentions: vi.fn(),
    getReposts: vi.fn(),
  }
  const channelAccountService = {
    createAccount: vi.fn(),
  }
  const twitterBillingService = {
    containsUrl: vi.fn(),
    getReadChargeAmount: vi.fn().mockImplementation((type: string) => {
      if (type === 'user') {
        return 1
      }
      return 0.5
    }),
    getWriteChargeAmount: vi.fn().mockReturnValue(1),
    ensureSufficientBalance: vi.fn(),
    chargeReadResources: vi.fn(),
    chargeWriteOperation: vi.fn(),
  }

  const service = new TwitterService(
    redisService as any,
    twitterApiService as any,
    channelAccountService as any,
    twitterBillingService as any,
  )
  ;(service as any).accountRepository = {
    getByIdAndUserId: vi.fn().mockResolvedValue({
      id: 'account_1',
      userId: 'user_1',
      type: AccountType.TWITTER,
      uid: 'twitter_uid_1',
    }),
  }
  ;(service as any).oauth2CredentialRepository = {
    getOne: vi.fn().mockResolvedValue({
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      accessTokenExpiresAt: 9999999999,
    }),
  }

  return {
    service,
    accountRepository: (service as any).accountRepository,
    twitterApiService,
    twitterBillingService,
  }
}

describe('twitterService', () => {
  it('resolveTweet 支持 x.com 链接解析成 tweetId', async () => {
    const { service } = createService()

    const result = await service.resolveTweet('user_1', 'account_1', 'https://x.com/openai/status/1234567890')

    expect(result).toEqual({
      tweetId: '1234567890',
      tweetUrl: 'https://x.com/i/web/status/1234567890',
      resolvedUrl: 'https://x.com/openai/status/1234567890',
    })
  })

  it('resolveTweet 支持纯数字 tweetRef', async () => {
    const { service } = createService()

    const result = await service.resolveTweet('user_1', 'account_1', '1234567890')

    expect(result.tweetId).toBe('1234567890')
  })

  it('resolveTweet 会按 userId 和 accountId 首查账号归属', async () => {
    const { service, accountRepository } = createService()

    await service.resolveTweet('user_1', 'account_1', '1234567890')

    expect(accountRepository.getByIdAndUserId).toHaveBeenCalledWith('account_1', 'user_1')
  })

  it('resolveTweet 解析不到 tweetId 时抛 InvalidWorkLink', async () => {
    const { service } = createService()

    await expect(service.resolveTweet('user_1', 'account_1', 'https://x.com/openai'))
      .rejects
      .toMatchObject({ code: ResponseCode.InvalidWorkLink })
  })

  it('getUserInfoForUser 会按 userId 和 accountId 首查账号归属', async () => {
    const { service, accountRepository, twitterApiService } = createService()

    twitterApiService.getUserInfo.mockResolvedValue({
      data: {
        id: 'twitter_uid_1',
        name: 'Aitoearn',
        username: 'aitoearn',
      },
    })

    await service.getUserInfoForUser('user_1', 'account_1')

    expect(accountRepository.getByIdAndUserId).toHaveBeenCalledWith('account_1', 'user_1')
    expect(twitterApiService.getUserInfo).toHaveBeenCalledWith('access_token')
  })

  it('getHomeTimelineForUser 使用当前账号 uid 获取首页时间线', async () => {
    const { service, accountRepository, twitterApiService, twitterBillingService } = createService()

    twitterApiService.getHomeTimeline.mockResolvedValue({
      data: [
        {
          id: 'tweet_1',
          authorId: 'twitter_uid_1',
        },
      ],
      includes: {
        users: [
          {
            id: 'twitter_uid_1',
            name: 'Aitoearn',
            username: 'aitoearn',
          },
        ],
        media: [
          {
            mediaKey: 'media_1',
          },
        ],
      },
    })

    await service.getHomeTimelineForUser('user_1', 'account_1', {
      accountId: 'account_1',
      maxResults: '5',
      exclude: ['retweets'],
    })

    expect(accountRepository.getByIdAndUserId).toHaveBeenCalledWith('account_1', 'user_1')
    expect(twitterApiService.getHomeTimeline).toHaveBeenCalledWith(
      'twitter_uid_1',
      'access_token',
      expect.objectContaining({
        maxResults: 5,
        exclude: ['retweets'],
        expansions: ['attachments.media_keys', 'author_id'],
      }),
    )
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getHomeTimeline',
      endpoint: 'GET /2/users/:id/timelines/reverse_chronological',
      resources: [
        { type: 'post', id: 'tweet_1' },
        { type: 'user', id: 'twitter_uid_1' },
        { type: 'media', id: 'media_1' },
      ],
    }))
  })

  it('searchTweets 预检包含推文、作者和媒体资源', async () => {
    const { service, twitterApiService, twitterBillingService } = createService()

    twitterApiService.searchRecentPosts.mockResolvedValue({
      data: [{ id: 'tweet_1' }],
      includes: {
        users: [{ id: 'author_1' }],
        media: [{ mediaKey: 'media_1' }],
      },
    })

    await service.searchTweets('user_1', 'account_1', {
      accountId: 'account_1',
      query: 'from:aitoearn',
      maxResults: '4',
    })

    expect(twitterBillingService.ensureSufficientBalance).toHaveBeenCalledWith({
      accountId: 'account_1',
      amount: 14,
    })
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'searchTweets',
      resources: [
        { type: 'post', id: 'tweet_1' },
        { type: 'user', id: 'author_1' },
        { type: 'media', id: 'media_1' },
      ],
    }))
  })

  it('getUserMentions 预检包含推文、作者和媒体资源', async () => {
    const { service, twitterApiService, twitterBillingService } = createService()

    twitterApiService.getUserMentions.mockResolvedValue({
      data: [{ id: 'mention_1' }],
      includes: {
        users: [{ id: 'author_1' }],
        media: [{ mediaKey: 'media_1' }],
      },
    })

    await service.getUserMentions('user_1', 'account_1', {
      accountId: 'account_1',
      maxResults: '6',
    })

    expect(twitterBillingService.ensureSufficientBalance).toHaveBeenCalledWith({
      accountId: 'account_1',
      amount: 21,
    })
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getUserMentions',
      resources: [
        { type: 'post', id: 'mention_1' },
        { type: 'user', id: 'author_1' },
        { type: 'media', id: 'media_1' },
      ],
    }))
  })

  it('getMyPostsForUser 使用当前账号 uid 获取自己的推文', async () => {
    const { service, accountRepository, twitterApiService, twitterBillingService } = createService()

    twitterApiService.getUserPosts.mockResolvedValue({
      data: [
        {
          id: 'tweet_1',
          authorId: 'twitter_uid_1',
        },
      ],
      includes: {
        users: [
          {
            id: 'twitter_uid_1',
            name: 'Aitoearn',
            username: 'aitoearn',
          },
        ],
        media: [
          {
            mediaKey: 'media_1',
          },
        ],
      },
    })

    await service.getMyPostsForUser('user_1', 'account_1', {
      accountId: 'account_1',
      maxResults: '5',
    })

    expect(accountRepository.getByIdAndUserId).toHaveBeenCalledWith('account_1', 'user_1')
    expect(twitterBillingService.ensureSufficientBalance).toHaveBeenCalledWith({
      accountId: 'account_1',
      amount: 17.5,
    })
    expect(twitterApiService.getUserPosts).toHaveBeenCalledWith(
      'twitter_uid_1',
      'access_token',
      expect.objectContaining({
        maxResults: 5,
        exclude: ['replies', 'retweets'],
        expansions: ['attachments.media_keys', 'author_id'],
      }),
    )
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getMyPosts',
      endpoint: 'GET /2/users/:id/tweets',
      resources: [
        { type: 'post', id: 'tweet_1' },
        { type: 'user', id: 'twitter_uid_1' },
        { type: 'media', id: 'media_1' },
      ],
    }))
  })

  it('getUserPostsForUser 使用请求里的目标 Twitter userId', async () => {
    const { service, twitterApiService, twitterBillingService } = createService()

    twitterApiService.getUserPosts.mockResolvedValue({
      data: [
        {
          id: 'tweet_2',
          authorId: 'target_1',
        },
      ],
    })

    await service.getUserPostsForUser('user_1', 'account_1', 'target_1', {
      accountId: 'account_1',
      maxResults: '10',
    })

    expect(twitterBillingService.ensureSufficientBalance).toHaveBeenCalledWith({
      accountId: 'account_1',
      amount: 35,
    })
    expect(twitterApiService.getUserPosts).toHaveBeenCalledWith(
      'target_1',
      'access_token',
      expect.objectContaining({
        maxResults: 10,
        exclude: ['replies', 'retweets'],
      }),
    )
  })

  it('getFollowersForUser 和 getFollowingForUser 使用目标用户分页查询', async () => {
    const { service, twitterApiService, twitterBillingService } = createService()

    twitterApiService.getFollowers.mockResolvedValue({
      data: [
        {
          id: 'follower_1',
          name: 'Follower',
          username: 'follower',
        },
      ],
    })
    twitterApiService.getFollowing.mockResolvedValue({
      data: [
        {
          id: 'following_1',
          name: 'Following',
          username: 'following',
        },
      ],
    })

    await service.getFollowersForUser('user_1', 'account_1', 'target_1', {
      accountId: 'account_1',
      maxResults: '20',
      paginationToken: 'page_2',
    })
    await service.getFollowingForUser('user_1', 'account_1', 'target_1', {
      accountId: 'account_1',
      maxResults: '20',
      paginationToken: 'page_2',
    })

    expect(twitterApiService.getFollowers).toHaveBeenCalledWith(
      'access_token',
      'target_1',
      expect.objectContaining({
        maxResults: 20,
        paginationToken: 'page_2',
      }),
    )
    expect(twitterApiService.getFollowing).toHaveBeenCalledWith(
      'access_token',
      'target_1',
      expect.objectContaining({
        maxResults: 20,
        paginationToken: 'page_2',
      }),
    )
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getFollowers',
      endpoint: 'GET /2/users/:id/followers',
      resources: [{ type: 'user', id: 'follower_1' }],
    }))
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getFollowing',
      endpoint: 'GET /2/users/:id/following',
      resources: [{ type: 'user', id: 'following_1' }],
    }))
  })

  it('getMyFollowersForUser 和 getMyFollowingForUser 使用当前账号 uid 查询', async () => {
    const { service, twitterApiService, twitterBillingService } = createService()

    twitterApiService.getFollowers.mockResolvedValue({
      data: [
        {
          id: 'follower_1',
          name: 'Follower',
          username: 'follower',
        },
      ],
    })
    twitterApiService.getFollowing.mockResolvedValue({
      data: [
        {
          id: 'following_1',
          name: 'Following',
          username: 'following',
        },
      ],
    })

    await service.getMyFollowersForUser('user_1', 'account_1', {
      accountId: 'account_1',
      maxResults: '20',
      paginationToken: 'page_2',
    })
    await service.getMyFollowingForUser('user_1', 'account_1', {
      accountId: 'account_1',
      maxResults: '20',
      paginationToken: 'page_2',
    })

    expect(twitterApiService.getFollowers).toHaveBeenCalledWith(
      'access_token',
      'twitter_uid_1',
      expect.objectContaining({
        maxResults: 20,
        paginationToken: 'page_2',
      }),
    )
    expect(twitterApiService.getFollowing).toHaveBeenCalledWith(
      'access_token',
      'twitter_uid_1',
      expect.objectContaining({
        maxResults: 20,
        paginationToken: 'page_2',
      }),
    )
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getMyFollowers',
      endpoint: 'GET /2/users/:id/followers',
      resources: [{ type: 'user', id: 'follower_1' }],
      metadata: {
        targetUserId: 'twitter_uid_1',
        requestedMaxResults: 20,
      },
    }))
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getMyFollowing',
      endpoint: 'GET /2/users/:id/following',
      resources: [{ type: 'user', id: 'following_1' }],
      metadata: {
        targetUserId: 'twitter_uid_1',
        requestedMaxResults: 20,
      },
    }))
  })

  it('getLikedPostsForUser 记录推文、作者和媒体读资源', async () => {
    const { service, twitterApiService, twitterBillingService } = createService()

    twitterApiService.getLikedPosts.mockResolvedValue({
      data: [
        {
          id: 'tweet_2',
          authorId: 'author_1',
        },
      ],
      includes: {
        users: [
          {
            id: 'author_1',
            name: 'Author',
            username: 'author',
          },
        ],
        media: [
          {
            mediaKey: 'media_2',
          },
        ],
      },
    })

    await service.getLikedPostsForUser('user_1', 'account_1', 'target_1', {
      accountId: 'account_1',
      maxResults: '10',
    })

    expect(twitterApiService.getLikedPosts).toHaveBeenCalledWith(
      'access_token',
      'target_1',
      expect.objectContaining({
        maxResults: 10,
        expansions: ['attachments.media_keys', 'author_id'],
      }),
    )
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getLikedPosts',
      endpoint: 'GET /2/users/:id/liked_tweets',
      resources: [
        { type: 'post', id: 'tweet_2' },
        { type: 'user', id: 'author_1' },
        { type: 'media', id: 'media_2' },
      ],
    }))
  })

  it('getMyLikedPostsForUser 使用当前账号 uid 查询 liked posts', async () => {
    const { service, twitterApiService, twitterBillingService } = createService()

    twitterApiService.getLikedPosts.mockResolvedValue({
      data: [
        {
          id: 'tweet_3',
          authorId: 'author_1',
        },
      ],
      includes: {
        users: [
          {
            id: 'author_1',
            name: 'Author',
            username: 'author',
          },
        ],
        media: [
          {
            mediaKey: 'media_3',
          },
        ],
      },
    })

    await service.getMyLikedPostsForUser('user_1', 'account_1', {
      accountId: 'account_1',
      maxResults: '10',
    })

    expect(twitterApiService.getLikedPosts).toHaveBeenCalledWith(
      'access_token',
      'twitter_uid_1',
      expect.objectContaining({
        maxResults: 10,
        expansions: ['attachments.media_keys', 'author_id'],
      }),
    )
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getMyLikedPosts',
      endpoint: 'GET /2/users/:id/liked_tweets',
      resources: [
        { type: 'post', id: 'tweet_3' },
        { type: 'user', id: 'author_1' },
        { type: 'media', id: 'media_3' },
      ],
      metadata: {
        targetUserId: 'twitter_uid_1',
        requestedMaxResults: 10,
      },
    }))
  })

  it('getReposts 预检包含推文、作者和媒体资源', async () => {
    const { service, twitterApiService, twitterBillingService } = createService()

    twitterApiService.getReposts.mockResolvedValue({
      data: [{ id: 'repost_1' }],
      includes: {
        users: [{ id: 'author_1' }],
        media: [{ mediaKey: 'media_1' }],
      },
    })

    await service.getReposts('user_1', 'account_1', {
      accountId: 'account_1',
      tweetId: 'tweet_1',
      maxResults: '7',
    })

    expect(twitterBillingService.ensureSufficientBalance).toHaveBeenCalledWith({
      accountId: 'account_1',
      amount: 24.5,
    })
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getReposts',
      resources: [
        { type: 'post', id: 'repost_1' },
        { type: 'user', id: 'author_1' },
        { type: 'media', id: 'media_1' },
      ],
    }))
  })

  it('getMyBlocksForUser 和 getMyMutesForUser 使用当前账号 uid 查询', async () => {
    const { service, twitterApiService, twitterBillingService } = createService()

    twitterApiService.getBlocking.mockResolvedValue({
      data: [
        {
          id: 'blocked_1',
          name: 'Blocked',
          username: 'blocked',
        },
      ],
    })
    twitterApiService.getMuting.mockResolvedValue({
      data: [
        {
          id: 'muted_1',
          name: 'Muted',
          username: 'muted',
        },
      ],
    })

    await service.getMyBlocksForUser('user_1', 'account_1', {
      accountId: 'account_1',
      maxResults: '20',
      paginationToken: 'page_2',
    })
    await service.getMyMutesForUser('user_1', 'account_1', {
      accountId: 'account_1',
      maxResults: '20',
      paginationToken: 'page_2',
    })

    expect(twitterApiService.getBlocking).toHaveBeenCalledWith(
      'access_token',
      'twitter_uid_1',
      expect.objectContaining({
        maxResults: 20,
        paginationToken: 'page_2',
      }),
    )
    expect(twitterApiService.getMuting).toHaveBeenCalledWith(
      'access_token',
      'twitter_uid_1',
      expect.objectContaining({
        maxResults: 20,
        paginationToken: 'page_2',
      }),
    )
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getMyBlocks',
      endpoint: 'GET /2/users/:id/blocking',
      resources: [{ type: 'user', id: 'blocked_1' }],
    }))
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getMyMutes',
      endpoint: 'GET /2/users/:id/muting',
      resources: [{ type: 'user', id: 'muted_1' }],
    }))
  })

  it('getMyListsForUser 系列使用当前账号 uid 查询列表资源', async () => {
    const { service, twitterApiService, twitterBillingService } = createService()

    twitterApiService.getOwnedLists.mockResolvedValue({
      data: [
        {
          id: 'list_1',
          name: 'Owned List',
        },
      ],
    })
    twitterApiService.getFollowedLists.mockResolvedValue({
      data: [
        {
          id: 'list_2',
          name: 'Followed List',
        },
      ],
    })
    twitterApiService.getListMemberships.mockResolvedValue({
      data: [
        {
          id: 'list_3',
          name: 'Member List',
        },
      ],
    })
    twitterApiService.getPinnedLists.mockResolvedValue({
      data: [
        {
          id: 'list_4',
          name: 'Pinned List',
        },
      ],
    })

    await service.getMyOwnedListsForUser('user_1', 'account_1', {
      accountId: 'account_1',
      maxResults: '20',
      paginationToken: 'page_2',
    })
    await service.getMyFollowedListsForUser('user_1', 'account_1', {
      accountId: 'account_1',
      maxResults: '20',
      paginationToken: 'page_2',
    })
    await service.getMyListMembershipsForUser('user_1', 'account_1', {
      accountId: 'account_1',
      maxResults: '20',
      paginationToken: 'page_2',
    })
    await service.getMyPinnedListsForUser('user_1', 'account_1', {
      accountId: 'account_1',
    })

    expect(twitterApiService.getOwnedLists).toHaveBeenCalledWith(
      'access_token',
      'twitter_uid_1',
      expect.objectContaining({
        maxResults: 20,
        paginationToken: 'page_2',
      }),
    )
    expect(twitterApiService.getFollowedLists).toHaveBeenCalledWith(
      'access_token',
      'twitter_uid_1',
      expect.objectContaining({
        maxResults: 20,
        paginationToken: 'page_2',
      }),
    )
    expect(twitterApiService.getListMemberships).toHaveBeenCalledWith(
      'access_token',
      'twitter_uid_1',
      expect.objectContaining({
        maxResults: 20,
        paginationToken: 'page_2',
      }),
    )
    expect(twitterApiService.getPinnedLists).toHaveBeenCalledWith(
      'access_token',
      'twitter_uid_1',
      {},
    )
    expect(twitterBillingService.ensureSufficientBalance).toHaveBeenLastCalledWith({
      accountId: 'account_1',
      amount: 8,
    })
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getMyOwnedLists',
      endpoint: 'GET /2/users/:id/owned_lists',
      resources: [{ type: 'list', id: 'list_1' }],
    }))
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getMyFollowedLists',
      endpoint: 'GET /2/users/:id/followed_lists',
      resources: [{ type: 'list', id: 'list_2' }],
    }))
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getMyListMemberships',
      endpoint: 'GET /2/users/:id/list_memberships',
      resources: [{ type: 'list', id: 'list_3' }],
    }))
    expect(twitterBillingService.chargeReadResources).toHaveBeenCalledWith(expect.objectContaining({
      operation: 'getMyPinnedLists',
      endpoint: 'GET /2/users/:id/pinned_lists',
      resources: [{ type: 'list', id: 'list_4' }],
      metadata: {
        targetUserId: 'twitter_uid_1',
        requestedMaxResults: 16,
      },
    }))
  })
})

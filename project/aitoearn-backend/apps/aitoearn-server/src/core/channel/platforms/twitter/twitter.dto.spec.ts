import { describe, expect, it } from 'vitest'
import {
  TwitterAccountDto,
  TwitterBookmarksDto,
  TwitterHomeTimelineDto,
  TwitterMentionsDto,
  TwitterMyLikedPostsDto,
  TwitterMyListDto,
  TwitterMyPinnedListDto,
  TwitterMyPostsDto,
  TwitterMyUserListDto,
  TwitterQuoteActionDto,
  TwitterReplyActionDto,
  TwitterResolveTweetDto,
  TwitterSearchTweetsDto,
  TwitterTweetListDto,
  TwitterUserByUsernameDto,
  TwitterUserLikedPostsDto,
  TwitterUserListDto,
  TwitterUserPostsDto,
} from './twitter.dto'

describe('twitterDto schema', () => {
  it('mentions 查询不要求 userId，并保留时间筛选字段', () => {
    const data = TwitterMentionsDto.schema.parse({
      accountId: 'account_1',
      sinceId: 'since_1',
      startTime: '2026-04-01T00:00:00Z',
      endTime: '2026-04-02T00:00:00Z',
    })

    expect(data).toEqual({
      accountId: 'account_1',
      sinceId: 'since_1',
      startTime: '2026-04-01T00:00:00Z',
      endTime: '2026-04-02T00:00:00Z',
    })
  })

  it('reply action 会 trim 文本', () => {
    const data = TwitterReplyActionDto.schema.parse({
      accountId: 'account_1',
      tweetId: 'tweet_1',
      text: '  hello  ',
    })

    expect(data.text).toBe('hello')
  })

  it('bookmarks 查询只需要 accountId 和分页参数', () => {
    const data = TwitterBookmarksDto.schema.parse({
      accountId: 'account_1',
      maxResults: '20',
      paginationToken: 'page_2',
    })

    expect(data).toEqual({
      accountId: 'account_1',
      maxResults: '20',
      paginationToken: 'page_2',
    })
  })

  it('resolve tweet 是唯一接收 tweetRef 的 schema', () => {
    const data = TwitterResolveTweetDto.schema.parse({
      accountId: 'account_1',
      tweetRef: ' https://x.com/user/status/123 ',
    })

    expect(data).toEqual({
      accountId: 'account_1',
      tweetRef: 'https://x.com/user/status/123',
    })
  })

  it('tweet list 查询只接收 tweetId 和分页参数', () => {
    const data = TwitterTweetListDto.schema.parse({
      accountId: 'account_1',
      tweetId: 'tweet_1',
      tweetRef: 'https://x.com/user/status/tweet_1',
      maxResults: '10',
    })

    expect(data).toEqual({
      accountId: 'account_1',
      tweetId: 'tweet_1',
      maxResults: '10',
    })
  })

  it('search tweets 会 trim query', () => {
    const data = TwitterSearchTweetsDto.schema.parse({
      accountId: 'account_1',
      query: '  openai  ',
    })

    expect(data.query).toBe('openai')
  })

  it('username 查询会 trim 但保留 @ 给 service 处理', () => {
    const data = TwitterUserByUsernameDto.schema.parse({
      accountId: 'account_1',
      username: '  @openai  ',
    })

    expect(data.username).toBe('@openai')
  })

  it('当前账号查询只需要 accountId', () => {
    const data = TwitterAccountDto.schema.parse({
      accountId: 'account_1',
      userId: 'target_1',
    })

    expect(data).toEqual({
      accountId: 'account_1',
    })
  })

  it('home timeline 查询不接收目标 userId', () => {
    const data = TwitterHomeTimelineDto.schema.parse({
      accountId: 'account_1',
      userId: 'target_1',
      maxResults: '20',
      exclude: ['retweets'],
    })

    expect(data).toEqual({
      accountId: 'account_1',
      maxResults: '20',
      exclude: ['retweets'],
    })
  })

  it('自己的推文查询不接收目标 userId', () => {
    const data = TwitterMyPostsDto.schema.parse({
      accountId: 'account_1',
      userId: 'target_1',
      maxResults: '20',
      exclude: ['retweets'],
    })

    expect(data).toEqual({
      accountId: 'account_1',
      maxResults: '20',
      exclude: ['retweets'],
    })
  })

  it('自己的关系列表查询不接收目标 userId', () => {
    const data = TwitterMyUserListDto.schema.parse({
      accountId: 'account_1',
      userId: 'target_1',
      maxResults: '50',
      paginationToken: 'page_2',
    })

    expect(data).toEqual({
      accountId: 'account_1',
      maxResults: '50',
      paginationToken: 'page_2',
    })
  })

  it('自己的列表查询不接收目标 userId', () => {
    const data = TwitterMyListDto.schema.parse({
      accountId: 'account_1',
      userId: 'target_1',
      maxResults: '50',
      paginationToken: 'page_2',
    })

    expect(data).toEqual({
      accountId: 'account_1',
      maxResults: '50',
      paginationToken: 'page_2',
    })
  })

  it('自己的 pinned lists 查询只接收 accountId', () => {
    const data = TwitterMyPinnedListDto.schema.parse({
      accountId: 'account_1',
      maxResults: '50',
      paginationToken: 'page_2',
    })

    expect(data).toEqual({
      accountId: 'account_1',
    })
  })

  it('自己的 liked posts 查询不接收目标 userId', () => {
    const data = TwitterMyLikedPostsDto.schema.parse({
      accountId: 'account_1',
      userId: 'target_1',
      maxResults: '10',
    })

    expect(data).toEqual({
      accountId: 'account_1',
      maxResults: '10',
    })
  })

  it('用户关系列表不接收目标 userId，目标 ID 来自路径参数', () => {
    const data = TwitterUserListDto.schema.parse({
      accountId: 'account_1',
      userId: ' target_1 ',
      maxResults: '50',
      paginationToken: 'page_2',
    })

    expect(data).toEqual({
      accountId: 'account_1',
      maxResults: '50',
      paginationToken: 'page_2',
    })
  })

  it('用户推文查询不接收目标 userId，目标 ID 来自路径参数', () => {
    const data = TwitterUserPostsDto.schema.parse({
      accountId: 'account_1',
      userId: ' target_1 ',
      maxResults: '20',
      exclude: ['retweets'],
    })

    expect(data).toEqual({
      accountId: 'account_1',
      maxResults: '20',
      exclude: ['retweets'],
    })
  })

  it('用户 liked posts 查询不接收目标 userId，目标 ID 来自路径参数', () => {
    const data = TwitterUserLikedPostsDto.schema.parse({
      accountId: 'account_1',
      userId: ' target_1 ',
    })

    expect(data).toEqual({
      accountId: 'account_1',
    })
  })

  it('quote action 会 trim 文本', () => {
    const data = TwitterQuoteActionDto.schema.parse({
      accountId: 'account_1',
      tweetId: 'tweet_1',
      text: '  quote  ',
    })

    expect(data.text).toBe('quote')
  })
})

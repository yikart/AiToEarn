import type { z } from 'zod'
import { Injectable } from '@nestjs/common'
import { getUser, toYamlTextResult } from '@yikart/common'
import { Tool } from '@yikart/nest-mcp'
import { TwitterService } from './platforms/twitter/twitter.service'
import {
  getTwitterUserByUsernameSchema,
  listHomeTimelineSchema,
  listMyBookmarksSchema,
  listMyConnectionsSchema,
  listMyLikedTweetsSchema,
  listMyListsSchema,
  listMyMentionsSchema,
  listMyPinnedListsSchema,
  listMyTweetsSchema,
  listUserConnectionsByIdSchema,
  listUserLikedTweetsByIdSchema,
  listUserTweetsByIdSchema,
  quoteTweetSchema,
  replyTweetSchema,
  resolveTweetSchema,
  searchTweetsSchema,
  tweetActionSchema,
  tweetListSchema,
  twitterAccountSchema,
} from './twitter-mcp.schema'

@Injectable()
export class TwitterMcpController {
  constructor(
    private readonly twitterService: TwitterService,
  ) {}

  @Tool({
    name: 'resolveTweet',
    description: 'Resolve a Twitter/X URL, short link, or raw tweet reference into a tweetId. Use this first when the user provides a link.',
    parameters: resolveTweetSchema,
  })
  async resolveTweet(params: z.infer<typeof resolveTweetSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.resolveTweet(user.id, params.accountId, params.tweetRef))
  }

  @Tool({
    name: 'searchTweets',
    description: 'Search recent Twitter/X tweets. Returns tweet IDs that can be used by getTweet, replyTweet, and other tweet tools.',
    parameters: searchTweetsSchema,
  })
  async searchTweets(params: z.infer<typeof searchTweetsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.searchTweets(user.id, params.accountId, params))
  }

  @Tool({
    name: 'getTwitterMe',
    description: 'Get the authenticated Twitter/X account profile.',
    parameters: twitterAccountSchema,
  })
  async getTwitterMe(params: z.infer<typeof twitterAccountSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getUserInfoForUser(user.id, params.accountId))
  }

  @Tool({
    name: 'listHomeTimeline',
    description: 'List the authenticated Twitter/X account home timeline.',
    parameters: listHomeTimelineSchema,
  })
  async listHomeTimeline(params: z.infer<typeof listHomeTimelineSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getHomeTimelineForUser(user.id, params.accountId, params))
  }

  @Tool({
    name: 'getTwitterUserByUsername',
    description: 'Get a Twitter/X user by username. Use this before listUserTweetsById when only a username is known.',
    parameters: getTwitterUserByUsernameSchema,
  })
  async getTwitterUserByUsername(params: z.infer<typeof getTwitterUserByUsernameSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getUserByUsername(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listMyTweets',
    description: 'List tweets for the authenticated Twitter/X account.',
    parameters: listMyTweetsSchema,
  })
  async listMyTweets(params: z.infer<typeof listMyTweetsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getMyPostsForUser(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listUserTweetsById',
    description: 'List tweets for a Twitter/X user ID.',
    parameters: listUserTweetsByIdSchema,
  })
  async listUserTweetsById(params: z.infer<typeof listUserTweetsByIdSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getUserPostsForUser(user.id, params.accountId, params.userId, params))
  }

  @Tool({
    name: 'listMyFollowers',
    description: 'List followers for the authenticated Twitter/X account.',
    parameters: listMyConnectionsSchema,
  })
  async listMyFollowers(params: z.infer<typeof listMyConnectionsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getMyFollowersForUser(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listUserFollowersById',
    description: 'List followers for a Twitter/X user ID.',
    parameters: listUserConnectionsByIdSchema,
  })
  async listUserFollowersById(params: z.infer<typeof listUserConnectionsByIdSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getFollowersForUser(user.id, params.accountId, params.userId, params))
  }

  @Tool({
    name: 'listMyFollowing',
    description: 'List accounts followed by the authenticated Twitter/X account.',
    parameters: listMyConnectionsSchema,
  })
  async listMyFollowing(params: z.infer<typeof listMyConnectionsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getMyFollowingForUser(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listUserFollowingById',
    description: 'List accounts followed by a Twitter/X user ID.',
    parameters: listUserConnectionsByIdSchema,
  })
  async listUserFollowingById(params: z.infer<typeof listUserConnectionsByIdSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getFollowingForUser(user.id, params.accountId, params.userId, params))
  }

  @Tool({
    name: 'listMyLikedTweets',
    description: 'List tweets liked by the authenticated Twitter/X account.',
    parameters: listMyLikedTweetsSchema,
  })
  async listMyLikedTweets(params: z.infer<typeof listMyLikedTweetsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getMyLikedPostsForUser(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listUserLikedTweetsById',
    description: 'List tweets liked by a Twitter/X user ID.',
    parameters: listUserLikedTweetsByIdSchema,
  })
  async listUserLikedTweetsById(params: z.infer<typeof listUserLikedTweetsByIdSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getLikedPostsForUser(user.id, params.accountId, params.userId, params))
  }

  @Tool({
    name: 'listMyMentions',
    description: 'List tweets mentioning the authenticated Twitter/X account.',
    parameters: listMyMentionsSchema,
  })
  async listMyMentions(params: z.infer<typeof listMyMentionsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getUserMentions(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listMyBookmarks',
    description: 'List bookmarked tweets for the authenticated Twitter/X account.',
    parameters: listMyBookmarksSchema,
  })
  async listMyBookmarks(params: z.infer<typeof listMyBookmarksSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getBookmarks(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listMyBlocks',
    description: 'List accounts blocked by the authenticated Twitter/X account.',
    parameters: listMyConnectionsSchema,
  })
  async listMyBlocks(params: z.infer<typeof listMyConnectionsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getMyBlocksForUser(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listMyMutes',
    description: 'List accounts muted by the authenticated Twitter/X account.',
    parameters: listMyConnectionsSchema,
  })
  async listMyMutes(params: z.infer<typeof listMyConnectionsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getMyMutesForUser(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listMyOwnedLists',
    description: 'List Twitter/X Lists owned by the authenticated account.',
    parameters: listMyListsSchema,
  })
  async listMyOwnedLists(params: z.infer<typeof listMyListsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getMyOwnedListsForUser(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listMyFollowedLists',
    description: 'List Twitter/X Lists followed by the authenticated account.',
    parameters: listMyListsSchema,
  })
  async listMyFollowedLists(params: z.infer<typeof listMyListsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getMyFollowedListsForUser(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listMyListMemberships',
    description: 'List Twitter/X Lists that include the authenticated account.',
    parameters: listMyListsSchema,
  })
  async listMyListMemberships(params: z.infer<typeof listMyListsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getMyListMembershipsForUser(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listMyPinnedLists',
    description: 'List Twitter/X Lists pinned by the authenticated account.',
    parameters: listMyPinnedListsSchema,
  })
  async listMyPinnedLists(params: z.infer<typeof listMyPinnedListsSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getMyPinnedListsForUser(user.id, params.accountId, params))
  }

  @Tool({
    name: 'getTweet',
    description: 'Get one tweet by tweetId. If the user provides a link, call resolveTweet first.',
    parameters: tweetActionSchema,
  })
  async getTweet(params: z.infer<typeof tweetActionSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getTweetDetailForUser(user.id, params.accountId, params.tweetId))
  }

  @Tool({
    name: 'listTweetConversation',
    description: 'List conversation replies for a tweetId. If the user provides a link, call resolveTweet first.',
    parameters: tweetListSchema,
  })
  async listTweetConversation(params: z.infer<typeof tweetListSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getTweetConversation(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listTweetQuotes',
    description: 'List tweets quoting a tweetId. If the user provides a link, call resolveTweet first.',
    parameters: tweetListSchema,
  })
  async listTweetQuotes(params: z.infer<typeof tweetListSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getQuotedPosts(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listTweetReposts',
    description: 'List repost tweets for a tweetId. If the user provides a link, call resolveTweet first.',
    parameters: tweetListSchema,
  })
  async listTweetReposts(params: z.infer<typeof tweetListSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getReposts(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listTweetRepostedBy',
    description: 'List users who reposted a tweetId. If the user provides a link, call resolveTweet first.',
    parameters: tweetListSchema,
  })
  async listTweetRepostedBy(params: z.infer<typeof tweetListSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getRepostedBy(user.id, params.accountId, params))
  }

  @Tool({
    name: 'listTweetLikingUsers',
    description: 'List users who liked a tweetId. If the user provides a link, call resolveTweet first.',
    parameters: tweetListSchema,
  })
  async listTweetLikingUsers(params: z.infer<typeof tweetListSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.getLikingUsers(user.id, params.accountId, params))
  }

  @Tool({
    name: 'replyTweet',
    description: 'Reply to a tweetId. If the user provides a link, call resolveTweet first. Side Effect: yes.',
    parameters: replyTweetSchema,
  })
  async replyTweet(params: z.infer<typeof replyTweetSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.replyPost(user.id, params.accountId, params.tweetId, params.text))
  }

  @Tool({
    name: 'quoteTweet',
    description: 'Quote a tweetId. If the user provides a link, call resolveTweet first. Side Effect: yes.',
    parameters: quoteTweetSchema,
  })
  async quoteTweet(params: z.infer<typeof quoteTweetSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.quotePost(user.id, params.accountId, params.tweetId, params.text))
  }

  @Tool({
    name: 'likeTweet',
    description: 'Like a tweetId. If the user provides a link, call resolveTweet first. Side Effect: yes.',
    parameters: tweetActionSchema,
  })
  async likeTweet(params: z.infer<typeof tweetActionSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.likePost(user.id, params.accountId, params.tweetId))
  }

  @Tool({
    name: 'unlikeTweet',
    description: 'Unlike a tweetId. If the user provides a link, call resolveTweet first. Side Effect: yes.',
    parameters: tweetActionSchema,
  })
  async unlikeTweet(params: z.infer<typeof tweetActionSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.unlikePost(user.id, params.accountId, params.tweetId))
  }

  @Tool({
    name: 'repostTweet',
    description: 'Repost a tweetId. If the user provides a link, call resolveTweet first. Side Effect: yes.',
    parameters: tweetActionSchema,
  })
  async repostTweet(params: z.infer<typeof tweetActionSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.repostPost(user.id, params.accountId, params.tweetId))
  }

  @Tool({
    name: 'undoRepostTweet',
    description: 'Undo repost for a tweetId. If the user provides a link, call resolveTweet first. Side Effect: yes.',
    parameters: tweetActionSchema,
  })
  async undoRepostTweet(params: z.infer<typeof tweetActionSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.undoRepostPost(user.id, params.accountId, params.tweetId))
  }

  @Tool({
    name: 'bookmarkTweet',
    description: 'Bookmark a tweetId. If the user provides a link, call resolveTweet first. Side Effect: yes.',
    parameters: tweetActionSchema,
  })
  async bookmarkTweet(params: z.infer<typeof tweetActionSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.bookmarkPost(user.id, params.accountId, params.tweetId))
  }

  @Tool({
    name: 'removeTweetBookmark',
    description: 'Remove bookmark from a tweetId. If the user provides a link, call resolveTweet first. Side Effect: yes.',
    parameters: tweetActionSchema,
  })
  async removeTweetBookmark(params: z.infer<typeof tweetActionSchema>) {
    const user = getUser()
    return toYamlTextResult(await this.twitterService.unbookmarkPost(user.id, params.accountId, params.tweetId))
  }
}

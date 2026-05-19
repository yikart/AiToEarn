import type {
  TwitterBookmarkMutationResponseVo,
  TwitterCreatePostResponseVo,
  TwitterHideReplyResponseVo,
  TwitterLikePostResponseVo,
  TwitterListResponseVo,
  TwitterPaginationParams,
  TwitterPostDetailResponseVo,
  TwitterRePostResponseVo,
  TwitterResolveTweetVo,
  TwitterTimelinePaginationParams,
  TwitterTimelineResponseVo,
  TwitterUserInfoResponseVo,
  TwitterUserListResponseVo,
} from '@/api/types/twitter'
import http from '@/utils/request'

function userPath(userId: string) {
  return encodeURIComponent(userId)
}

// ============ P0: 推文互动 + 解析 ============

/** 推文链接/短链/ID 解析为 tweetId */
export function apiTwitterResolveTweet(params: { accountId: string, tweetRef: string }) {
  return http.post<TwitterResolveTweetVo>('plat/twitter/tweet/resolve', params)
}

/** 回复推文 */
export function apiTwitterReply(params: { accountId: string, tweetId: string, text: string }) {
  return http.post<TwitterCreatePostResponseVo>('plat/twitter/reply', params)
}

/** 引用推文 */
export function apiTwitterQuote(params: { accountId: string, tweetId: string, text: string }) {
  return http.post<TwitterCreatePostResponseVo>('plat/twitter/quote', params)
}

/** 点赞推文 */
export function apiTwitterLike(params: { accountId: string, tweetId: string }) {
  return http.post<TwitterLikePostResponseVo>('plat/twitter/like', params)
}

/** 取消点赞 */
export function apiTwitterUnlike(params: { accountId: string, tweetId: string }) {
  return http.post<TwitterLikePostResponseVo>('plat/twitter/unlike', params)
}

/** 转推 */
export function apiTwitterRepost(params: { accountId: string, tweetId: string }) {
  return http.post<TwitterRePostResponseVo>('plat/twitter/repost', params)
}

/** 取消转推 */
export function apiTwitterRepostUndo(params: { accountId: string, tweetId: string }) {
  return http.post<TwitterRePostResponseVo>('plat/twitter/repost/undo', params)
}

/** 收藏推文 */
export function apiTwitterBookmark(params: { accountId: string, tweetId: string }) {
  return http.post<TwitterBookmarkMutationResponseVo>('plat/twitter/bookmark', params)
}

/** 取消收藏 */
export function apiTwitterBookmarkRemove(params: { accountId: string, tweetId: string }) {
  return http.post<TwitterBookmarkMutationResponseVo>('plat/twitter/bookmark/remove', params)
}

/** 隐藏回复 */
export function apiTwitterReplyHide(params: { accountId: string, tweetId: string }) {
  return http.post<TwitterHideReplyResponseVo>('plat/twitter/reply/hide', params)
}

/** 取消隐藏回复 */
export function apiTwitterReplyUnhide(params: { accountId: string, tweetId: string }) {
  return http.post<TwitterHideReplyResponseVo>('plat/twitter/reply/unhide', params)
}

// ============ P1: 推文读取 ============

/** 获取推文详情 */
export function apiTwitterTweetDetail(params: { accountId: string, tweetId: string }) {
  return http.post<TwitterPostDetailResponseVo>('plat/twitter/tweet/detail', params)
}

/** 获取推文对话 */
export function apiTwitterTweetConversation(
  params: { accountId: string, tweetId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterTimelineResponseVo>('plat/twitter/tweet/conversation', params)
}

/** 搜索推文 */
export function apiTwitterSearchTweets(
  params: { accountId: string, query: string } & TwitterPaginationParams,
) {
  return http.post<TwitterTimelineResponseVo>('plat/twitter/tweets/search', params)
}

/** 获取用户提及 */
export function apiTwitterUserMentions(
  params: { accountId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterTimelineResponseVo>('plat/twitter/users/me/mentions', params)
}

/** 获取用户时间线 */
export function apiTwitterTimeline(
  params: { accountId: string, userId: string } & TwitterTimelinePaginationParams,
) {
  return http.post<TwitterTimelineResponseVo>('plat/twitter/timeline', params)
}

/** 获取用户推文（爬虫） */
export function apiTwitterUserPosts(
  params: { accountId: string, userId: string } & TwitterTimelinePaginationParams,
) {
  return http.post<TwitterTimelineResponseVo>('plat/twitter/user/posts', params)
}

/** 获取指定用户推文 */
export function apiTwitterUserPostsForUser(
  params: { accountId: string, userId: string } & TwitterTimelinePaginationParams,
) {
  const { userId, ...body } = params
  return http.post<TwitterTimelineResponseVo>(`plat/twitter/users/${userPath(userId)}/posts`, body)
}

// ============ P2: 数据查询 + 用户信息 ============

/** 获取用户信息（爬虫） */
export function apiTwitterUserInfo() {
  return http.post<TwitterUserInfoResponseVo>('plat/twitter/user/info')
}

/** 按用户名查询用户 */
export function apiTwitterUserByUsername(params: { accountId: string, username: string }) {
  return http.post<TwitterUserInfoResponseVo>('plat/twitter/users/by-username', params)
}

/** 获取推文引用列表 */
export function apiTwitterTweetQuotes(
  params: { accountId: string, tweetId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterTimelineResponseVo>('plat/twitter/tweet/quotes', params)
}

/** 获取推文转推列表 */
export function apiTwitterTweetReposts(
  params: { accountId: string, tweetId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterTimelineResponseVo>('plat/twitter/tweet/reposts', params)
}

/** 获取转推用户列表 */
export function apiTwitterTweetRepostedBy(
  params: { accountId: string, tweetId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterUserListResponseVo>('plat/twitter/tweet/reposted-by', params)
}

/** 获取点赞用户列表 */
export function apiTwitterTweetLikingUsers(
  params: { accountId: string, tweetId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterUserListResponseVo>('plat/twitter/tweet/liking-users', params)
}

/** 获取书签列表 */
export function apiTwitterBookmarks(
  params: { accountId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterTimelineResponseVo>('plat/twitter/users/me/bookmarks', params)
}

// ============ P3: 新增 API 端点（非爬虫） ============

/** 获取当前认证用户信息 */
export function apiTwitterUsersMe(params: { accountId: string }) {
  return http.post<TwitterUserInfoResponseVo>('plat/twitter/users/me', params)
}

/** 获取首页时间线（API 接口，非爬虫） */
export function apiTwitterHomeTimeline(
  params: { accountId: string } & TwitterTimelinePaginationParams,
) {
  return http.post<TwitterTimelineResponseVo>('plat/twitter/users/home-timeline', params)
}

/** 获取我的推文 */
export function apiTwitterMyPosts(
  params: { accountId: string } & TwitterTimelinePaginationParams,
) {
  return http.post<TwitterTimelineResponseVo>('plat/twitter/users/me/posts', params)
}

/** 获取我的关注者列表 */
export function apiTwitterMyFollowers(
  params: { accountId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterUserListResponseVo>('plat/twitter/users/me/followers', params)
}

/** 获取我的关注中列表 */
export function apiTwitterMyFollowing(
  params: { accountId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterUserListResponseVo>('plat/twitter/users/me/following', params)
}

/** 获取我喜欢的推文 */
export function apiTwitterMyLikedPosts(
  params: { accountId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterTimelineResponseVo>('plat/twitter/users/me/liked-posts', params)
}

/** 获取我的拉黑用户 */
export function apiTwitterMyBlocks(
  params: { accountId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterUserListResponseVo>('plat/twitter/users/me/blocks', params)
}

/** 获取我的静音用户 */
export function apiTwitterMyMutes(
  params: { accountId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterUserListResponseVo>('plat/twitter/users/me/mutes', params)
}

/** 获取我创建的列表 */
export function apiTwitterMyOwnedLists(
  params: { accountId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterListResponseVo>('plat/twitter/users/me/owned-lists', params)
}

/** 获取我关注的列表 */
export function apiTwitterMyFollowedLists(
  params: { accountId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterListResponseVo>('plat/twitter/users/me/followed-lists', params)
}

/** 获取我所在的列表 */
export function apiTwitterMyListMemberships(
  params: { accountId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterListResponseVo>('plat/twitter/users/me/list-memberships', params)
}

/** 获取我置顶的列表 */
export function apiTwitterMyPinnedLists(
  params: { accountId: string } & TwitterPaginationParams,
) {
  return http.post<TwitterListResponseVo>('plat/twitter/users/me/pinned-lists', params)
}

/** 获取关注者列表 */
export function apiTwitterUsersFollowers(
  params: { accountId: string, userId: string } & TwitterPaginationParams,
) {
  const { userId, ...body } = params
  return http.post<TwitterUserListResponseVo>(`plat/twitter/users/${userPath(userId)}/followers`, body)
}

/** 获取关注中列表 */
export function apiTwitterUsersFollowing(
  params: { accountId: string, userId: string } & TwitterPaginationParams,
) {
  const { userId, ...body } = params
  return http.post<TwitterUserListResponseVo>(`plat/twitter/users/${userPath(userId)}/following`, body)
}

/** 获取用户喜欢的推文 */
export function apiTwitterUsersLikedPosts(
  params: { accountId: string, userId: string } & TwitterPaginationParams,
) {
  const { userId, ...body } = params
  return http.post<TwitterTimelineResponseVo>(`plat/twitter/users/${userPath(userId)}/liked-posts`, body)
}

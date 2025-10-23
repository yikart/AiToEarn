/*
 * @Author: nevin
 * @Date: 2025-02-15 20:59:55
 * @LastEditTime: 2025-04-27 18:00:18
 * @LastEditors: nevin
 * @Description: signIn SignIn 签到
 */
import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Render,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, Public } from '../../auth/auth.guard'
import { TokenInfo } from '../../auth/interfaces/auth.interfaces'
import { OrgGuard } from '../../common/interceptor/transform.interceptor'
import { PlatYoutubeNatsApi } from '../../transports/channel/api/youtube.natsApi'
import {
  DeleteCommentDto,
  DeletePlayItemsDto,
  DeletePlayListDto,
  DeleteVideoDto,
  GetChannelsListDto,
  GetChannelsSectionsListDto,
  GetCommentsListDto,
  GetCommentThreadsListDto,
  GetPlayItemsDto,
  GetPlayListDto,
  GetVideoCategoriesDto,
  GetVideoRateDto,
  GetVideosListDto,
  // InitVideoUploadDto,
  InsertCommentDto,
  InsertCommentThreadsDto,
  InsertPlayItemsDto,
  InsertPlayListDto,
  SearchDto,
  SetCommentThreadsModerationStatusDto,
  UpdateCommentDto,
  UpdatePlayItemsDto,
  UpdatePlayListDto,
  UpdateVideoDto,
  VideoRateDto,
} from './dto/youtube.dto'
import { YoutubeService } from './youtube.service'

@ApiTags('plat/youtube - YouTube平台')
@Controller('plat/youtube')
export class YoutubeController {
  private readonly logger = new Logger(YoutubeController.name)

  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly platYoutubeNatsApi: PlatYoutubeNatsApi,
  ) {}

  @ApiOperation({ summary: '获取页面的认证URL' })
  @Get('auth/url')
  async getAuthUrl(
    @GetToken() token: TokenInfo,
    @Query('spaceId') spaceId?: string,
  ) {
    this.logger.log(`token: ${token}`)
    if (!token.mail) {
      throw new Error('缺少邮箱')
    }
    const res = await this.platYoutubeNatsApi.getAuthUrl(
      token.id,
      token.mail,
      undefined,
      spaceId || '',
    )
    return res
  }

  @ApiOperation({ summary: '获取账号授权状态回调' })
  @Post('auth/create-account/:taskId')
  /**
   * 获取账号授权异步任务的状态
   */
  async getAuthenTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return await this.youtubeService.getAuthTaskStatus(taskId)
  }

  // 获取AccessToken,并记录到用户，给平台回调用
  @Public()
  @UseGuards(OrgGuard)
  @Get('auth/callback')
  @Render('auth/back')
  async getAccessToken(
    @Query()
    query: {
      code: string
      state: string
    },
  ) {
    const stateData = JSON.parse(decodeURIComponent(query.state))
    const taskId = stateData.originalState // Use originalState as taskId
    const res = await this.platYoutubeNatsApi.setAccessToken(
      {
        taskId,
        ...query,
      },
    )
    return res
  }

  @ApiOperation({ summary: '检查账号是否已经授权' })
  @Get('auth/status/:accountId')
  async checkAccountAuthStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.youtubeService.checkAccountAuthStatus(accountId)
  }

  @ApiOperation({ summary: '刷新令牌token' })
  @Post('auth/refresh-token/:accountId')
  async refreshToken(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return this.youtubeService.refreshToken(accountId)
  }

  @ApiOperation({ summary: '获取视频类别列表' })
  @Get('video/categories')
  async getVideoCategories(
    @GetToken() token: TokenInfo,
    @Query() query: GetVideoCategoriesDto,
  ) {
    return await this.youtubeService.getVideoCategories(
      query.accountId,
      query.id,
      query.regionCode,
    )
  }

  @ApiOperation({ summary: '获取视频列表' })
  @Get('video/list')
  async getVideosList(
    @GetToken() token: TokenInfo,
    @Query() query: GetVideosListDto,
  ) {
    return await this.youtubeService.getVideosList(
      query.accountId,
      query.chart,
      query.id,
      query.myRating,
      query.maxResults,
      query.pageToken,
    )
  }

  // 创建评论会话
  @ApiOperation({ summary: '创建评论会话' })
  @Post('comment/threads/insert')
  async insertCommentThreads(
    @GetToken() token: TokenInfo,
    @Body() body: InsertCommentThreadsDto,
  ) {
    return await this.youtubeService.insertCommentThreads(
      body.accountId,
      body.channelId,
      body.videoId,
      body.textOriginal,
    )
  }

  // 获取评论会话列表
  @ApiOperation({ summary: '获取评论会话列表' })
  @Get('comment/threads/list')
  async getCommentThreadsList(
    @GetToken() token: TokenInfo,
    @Query() query: GetCommentThreadsListDto,
  ) {
    return await this.youtubeService.getCommentThreadsList(
      query.accountId,
      query.allThreadsRelatedToChannelId,
      query.id,
      query.videoId,
      query.maxResults,
      query.pageToken,
      query.order,
      query.searchTerms,
    )
  }

  // 设置评论会话的审核状态
  @ApiOperation({ summary: '设置评论会话的审核状态' })
  @Post('comment/threads/moderation/set')
  async setCommentThreadsModerationStatus(
    @GetToken() token: TokenInfo,
    @Body() body: SetCommentThreadsModerationStatusDto,
  ) {
    return await this.youtubeService.setCommentThreadsModerationStatus(
      body.accountId,
      body.id,
      body.moderationStatus,
      body?.banAuthor,
    )
  }

  // 创建二级评论
  @ApiOperation({ summary: '创建二级评论' })
  @Post('comment/insert')
  async insertComment(
    @GetToken() token: TokenInfo,
    @Body() body: InsertCommentDto,
  ) {
    return await this.youtubeService.insertComment(
      body.accountId,
      body.parentId,
      body.textOriginal,
    )
  }

  // 获取子评论列表
  @ApiOperation({ summary: '获取子评论列表' })
  @Get('comment/list')
  async getCommentsList(
    @GetToken() token: TokenInfo,
    @Query() query: GetCommentsListDto,
  ) {
    return await this.youtubeService.getCommentsList(
      query.accountId,
      query.id,
      query.parentId,
      query.maxResults,
      query.pageToken,
    )
  }

  // 更新评论
  @ApiOperation({ summary: '更新评论' })
  @Post('comment/update')
  async updateComment(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateCommentDto,
  ) {
    return await this.youtubeService.updateComment(
      body.accountId,
      body.id,
      body.textOriginal,
    )
  }

  // 删除评论
  @ApiOperation({ summary: '删除评论' })
  @Post('comment/delete')
  async deleteComment(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteCommentDto,
  ) {
    return await this.youtubeService.deleteComment(body.accountId, body.id)
  }

  // 设置视频的点赞、踩
  @ApiOperation({ summary: '设置视频的点赞、踩' })
  @Post('video/rating/set')
  async setVideoRate(@GetToken() token: TokenInfo, @Body() body: VideoRateDto) {
    return await this.youtubeService.setVideoRate(
      body.accountId,
      body.id,
      body.rating,
    )
  }

  // 获取视频的点赞、踩
  @ApiOperation({ summary: '获取视频的点赞、踩' })
  @Get('video/rating')
  async getVideoRate(
    @GetToken() token: TokenInfo,
    @Query() query: GetVideoRateDto,
  ) {
    return await this.youtubeService.getVideoRate(query.accountId, query.id)
  }

  // 删除视频
  @ApiOperation({ summary: '删除视频' })
  @Post('video/delete')
  async deleteVideo(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteVideoDto,
  ) {
    return await this.youtubeService.deleteVideo(body.accountId, body.id)
  }

  // 更新视频
  @ApiOperation({ summary: '更新视频' })
  @Post('video/update')
  async updateVideo(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateVideoDto,
  ) {
    return await this.youtubeService.updateVideo(
      body.accountId,
      body.id,
      body.title,
      body.categoryId,
      body?.defaultLanguage,
      body?.description,
      body?.privacyStatus,
      body?.tags,
      body?.publishAt,
      body?.recordingDate,
    )
  }

  // 创建播放列表
  @ApiOperation({ summary: '创建播放列表' })
  @Post('playlist/create')
  async createPlaylist(
    @GetToken() token: TokenInfo,
    @Body() body: InsertPlayListDto,
  ) {
    return await this.youtubeService.createPlaylist(
      body.accountId,
      body.title,
      body.description,
      body.privacyStatus,
    )
  }

  // 更新播放列表
  @ApiOperation({ summary: '更新播放列表' })
  @Post('playlist/update')
  async updatePlaylist(
    @GetToken() token: TokenInfo,
    @Body() body: UpdatePlayListDto,
  ) {
    return await this.youtubeService.updatePlaylist(
      body.accountId,
      body.id,
      body.title,
      body.description,
    )
  }

  // 删除播放列表
  @ApiOperation({ summary: '删除播放列表' })
  @Post('playlist/delete')
  async deletePlaylist(
    @GetToken() token: TokenInfo,
    @Body() body: DeletePlayListDto,
  ) {
    return await this.youtubeService.deletePlaylist(body.accountId, body.id)
  }

  // 获取播放列表
  @ApiOperation({ summary: '获取播放列表' })
  @Post('playlist/list')
  async getPlayList(
    @GetToken() token: TokenInfo,
    @Body() body: GetPlayListDto,
  ) {
    return await this.youtubeService.getPlayList(
      body.accountId,
      body?.channelId,
      body?.id,
      body?.mine,
      body?.maxResults,
      body?.pageToken,
    )
  }

  // 插入播放列表项
  @ApiOperation({ summary: '插入播放列表项' })
  @Post('playlist/items/insert')
  async insertPlayListItems(
    @GetToken() token: TokenInfo,
    @Body() body: InsertPlayItemsDto,
  ) {
    return await this.youtubeService.insertPlayListItems(
      body.accountId,
      body.playlistId,
      body.resourceId,
      body?.position,
      body?.note,
      body?.startAt,
      body?.endAt,
    )
  }

  // 更新播放列表项
  @ApiOperation({ summary: '更新播放列表项' })
  @Post('playlist/items/update')
  async updatePlayListItems(
    @GetToken() token: TokenInfo,
    @Body() body: UpdatePlayItemsDto,
  ) {
    return await this.youtubeService.updatePlayListItems(
      body.accountId,
      body.id,
      body.playlistId,
      body?.resourceId,
      body?.position,
      body?.note,
      body?.startAt,
      body?.endAt,
    )
  }

  // 删除播放列表项
  @ApiOperation({ summary: '删除播放列表项' })
  @Post('playlist/items/delete')
  async deletePlayListItems(
    @GetToken() token: TokenInfo,
    @Body() body: DeletePlayItemsDto,
  ) {
    return await this.youtubeService.deletePlayListItems(
      body.accountId,
      body.id,
    )
  }

  // 获取播放列表项
  @ApiOperation({ summary: '获取播放列表项' })
  @Post('playlist/items/list')
  async getPlayListItems(
    @GetToken() token: TokenInfo,
    @Body() body: GetPlayItemsDto,
  ) {
    return await this.youtubeService.getPlayListItems(
      body.accountId,
      body?.id,
      body?.playlistId,
      body?.maxResults,
      body?.pageToken,
      body?.videoId,
    )
  }

  // 获取频道列表
  @ApiOperation({ summary: '获取频道列表' })
  @Get('channel/list')
  async getChannelsList(
    @GetToken() token: TokenInfo,
    @Query() query: GetChannelsListDto,
  ) {
    return await this.youtubeService.getChannelsList(
      query.accountId,
      query?.forHandle,
      query?.forUsername,
      query?.id,
      query?.mine,
      query?.maxResults,
      query?.pageToken,
    )
  }

  // 更新账号频道ID
  @ApiOperation({ summary: '更新账号频道ID' })
  @Get('channel/update/channelId/:accountId')
  async updateChannelId(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.youtubeService.updateChannelId(
      accountId,
    )
  }

  // 获取频道板块列表
  @ApiOperation({ summary: '获取频道板块列表' })
  @Post('channel/sections/list')
  async getChannelsSectionsList(
    @GetToken() token: TokenInfo,
    @Body() body: GetChannelsSectionsListDto,
  ) {
    return await this.youtubeService.getChannelsSectionsList(
      body.accountId,
      body?.channelId,
      body?.id,
      body?.mine,
    )
  }

  // 获取通用数据
  @ApiOperation({ summary: '获取通用数据' })
  @Get('common/params')
  async getCommonParams() {
    return await this.youtubeService.getCommonParams()
  }

  /**
   * YouTube搜索接口
   * 支持多种搜索条件和排序方式
   */
  @ApiOperation({ summary: '搜索' })
  @Post('search')
  async search(
    @GetToken() token: TokenInfo,
    @Body() body: SearchDto,
  ) {
    return await this.youtubeService.search(
      body.accountId,
      body?.forMine,
      body?.maxResults,
      body?.order,
      body?.pageToken,
      body?.publishedBefore,
      body?.publishedAfter,
      body?.q,
      body?.type,
      body?.videoCategoryId,
    )
  }
}

import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { Response } from 'express'
import {
  AccountIdDto,
  ChannelsSectionsListDto,
  DeleteCommentDto,
  DeletePlayItemsDto,
  DeletePlayListDto,
  DeleteVideoDto,
  GetChannelsListDto,
  GetCommentsListDto,
  GetCommentThreadsListDto,
  GetPlayItemsDto,
  GetPlayListDto,
  GetVideoRateDto,
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
  VideoCategoriesDto,
  VideoRateDto,
  VideosListDto,
} from './youtube.dto'
import { YoutubeService } from './youtube.service'

@ApiTags('Platform/Youtube')
@Controller('plat/youtube')
export class YoutubeController {
  private readonly logger = new Logger(YoutubeController.name)

  constructor(
    private readonly youtubeService: YoutubeService,
  ) {}

  @ApiDoc({
    summary: 'Get Authorization URL',
  })
  @Get('/auth/url')
  async getAuthUrl(
    @GetToken() token: TokenInfo,
    @Query('spaceId') spaceId?: string,
    @Query('callbackUrl') callbackUrl?: string,
    @Query('callbackMethod') callbackMethod?: 'GET' | 'POST',
  ) {
    if (!token.mail) {
      throw new Error('缺少邮箱')
    }
    return await this.youtubeService.getAuthUrl(
      token.id,
      token.mail,
      undefined,
      spaceId || '',
      callbackUrl,
      callbackMethod,
    )
  }

  @ApiDoc({
    summary: 'Get Authorization Task Status',
  })
  @Post('/auth/create-account/:taskId')
  async getAuthenTaskStatus(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    return await this.youtubeService.getAuthInfo(taskId)
  }

  @Public()
  @Get('/auth/callback')
  async getAccessToken(
    @Query()
    query: {
      code: string
      state: string
    },
    @Res() res: Response,
  ) {
    const stateData = JSON.parse(decodeURIComponent(query.state))
    const taskId = stateData.originalState
    const result = await this.youtubeService.setAccessToken(
      taskId,
      query.code,
    )

    if (result.status === 1 && result.callbackUrl) {
      return res.render('auth/back', { ...result, autoPostCallback: true })
    }

    return res.render('auth/back', result)
  }

  @ApiDoc({
    summary: 'Check Account Authorization Status',
  })
  @Get('/auth/status/:accountId')
  async checkAccountAuthStatus(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.youtubeService.isAuthorized(accountId)
  }

  @ApiDoc({
    summary: 'Refresh Channel Token',
  })
  @Post('/auth/refresh-token/:accountId')
  async refreshToken(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.youtubeService.getUserAccessToken(accountId)
  }

  @ApiDoc({
    summary: 'Get Video Categories',
    query: VideoCategoriesDto.schema,
  })
  @Get('/video/categories')
  async getVideoCategories(
    @GetToken() token: TokenInfo,
    @Query() query: VideoCategoriesDto,
  ) {
    return await this.youtubeService.getVideoCategoriesList(
      query.accountId,
      query.id,
      query.regionCode,
    )
  }

  @ApiDoc({
    summary: 'Get Video List',
    query: VideosListDto.schema,
  })
  @Get('/video/list')
  async getVideosList(
    @GetToken() token: TokenInfo,
    @Query() query: VideosListDto,
  ) {
    return await this.youtubeService.getVideosList(
      query.accountId,
      query.chart,
      query.id?.split(','),
      query.myRating,
      query.maxResults,
      query.pageToken,
    )
  }

  @ApiDoc({
    summary: 'Update Video',
    body: UpdateVideoDto.schema,
  })
  @Post('/video/update')
  async updateVideo(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateVideoDto,
  ) {
    return await this.youtubeService.updateVideo(
      body.accountId,
      {
        id: body.id,
        snippet: {
          title: body.title,
          categoryId: body.categoryId,
          ...(body.defaultLanguage && { defaultLanguage: body.defaultLanguage }),
          ...(body.description && { description: body.description }),
          ...(body.tags && { tags: body.tags.split(',') }),
        },
        status: {
          ...(body.privacyStatus && { privacyStatus: body.privacyStatus }),
          ...(body.publishAt && { publishAt: body.publishAt }),
        },
        ...(body.recordingDate && {
          recordingDetails: { recordingDate: body.recordingDate },
        }),
      },
    )
  }

  @ApiDoc({
    summary: 'Delete Video',
    body: DeleteVideoDto.schema,
  })
  @Post('/video/delete')
  async deleteVideo(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteVideoDto,
  ) {
    return await this.youtubeService.deletePost(body.accountId, body.id)
  }

  @ApiDoc({
    summary: 'Set Video Rating',
    body: VideoRateDto.schema,
  })
  @Post('/video/rating/set')
  async setVideoRate(
    @GetToken() token: TokenInfo,
    @Body() body: VideoRateDto,
  ) {
    return await this.youtubeService.setVideosRate(
      body.accountId,
      body.id,
      body.rating,
    )
  }

  @ApiDoc({
    summary: 'Get Video Rating',
    query: GetVideoRateDto.schema,
  })
  @Get('/video/rating')
  async getVideoRate(
    @GetToken() token: TokenInfo,
    @Query() query: GetVideoRateDto,
  ) {
    return await this.youtubeService.getVideosRating(
      query.accountId,
      query.id.split(','),
    )
  }

  @ApiDoc({
    summary: 'Create Comment Thread',
    body: InsertCommentThreadsDto.schema,
  })
  @Post('/comment/threads/insert')
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

  @ApiDoc({
    summary: 'List Comment Threads',
    query: GetCommentThreadsListDto.schema,
  })
  @Get('/comment/threads/list')
  async getCommentThreadsList(
    @GetToken() token: TokenInfo,
    @Query() query: GetCommentThreadsListDto,
  ) {
    return await this.youtubeService.getCommentThreadsList(
      query.accountId,
      query.allThreadsRelatedToChannelId,
      query.id?.split(','),
      query.videoId,
      query.maxResults,
      query.pageToken,
      query.order,
      query.searchTerms,
    )
  }

  @ApiDoc({
    summary: 'Set Comment Thread Moderation Status',
    body: SetCommentThreadsModerationStatusDto.schema,
  })
  @Post('/comment/threads/moderation/set')
  async setCommentThreadsModerationStatus(
    @GetToken() token: TokenInfo,
    @Body() body: SetCommentThreadsModerationStatusDto,
  ) {
    return await this.youtubeService.setModerationStatusComments(
      body.accountId,
      body.id.split(','),
      body.moderationStatus,
      body.banAuthor || false,
    )
  }

  @ApiDoc({
    summary: 'Create Reply Comment',
    body: InsertCommentDto.schema,
  })
  @Post('/comment/insert')
  async insertComment(
    @GetToken() token: TokenInfo,
    @Body() body: InsertCommentDto,
  ) {
    return await this.youtubeService.insertComment(
      body.accountId,
      body.parentId || '',
      body.textOriginal || '',
    )
  }

  @ApiDoc({
    summary: 'List Reply Comments',
    query: GetCommentsListDto.schema,
  })
  @Get('/comment/list')
  async getCommentsList(
    @GetToken() token: TokenInfo,
    @Query() query: GetCommentsListDto,
  ) {
    return await this.youtubeService.getCommentsList(
      query.accountId,
      query.parentId,
      query.id?.split(','),
      query.maxResults,
      query.pageToken,
    )
  }

  @ApiDoc({
    summary: 'Update Comment',
    body: UpdateCommentDto.schema,
  })
  @Post('/comment/update')
  async updateComment(
    @GetToken() token: TokenInfo,
    @Body() body: UpdateCommentDto,
  ) {
    return await this.youtubeService.updateComment(
      body.accountId,
      body.id || '',
      body.textOriginal || '',
    )
  }

  @ApiDoc({
    summary: 'Delete Comment',
    body: DeleteCommentDto.schema,
  })
  @Post('/comment/delete')
  async deleteComment(
    @GetToken() token: TokenInfo,
    @Body() body: DeleteCommentDto,
  ) {
    return await this.youtubeService.deleteComment(body.accountId, body.id)
  }

  @ApiDoc({
    summary: 'Create Playlist',
    body: InsertPlayListDto.schema,
  })
  @Post('/playlist/create')
  async createPlaylist(
    @GetToken() token: TokenInfo,
    @Body() body: InsertPlayListDto,
  ) {
    const snippet = {
      title: body.title,
      description: body.description,
    }
    const status = {
      privacyStatus: body.privacyStatus,
    }
    return await this.youtubeService.insertPlayList(
      body.accountId,
      snippet,
      status,
    )
  }

  @ApiDoc({
    summary: 'Update Playlist',
    body: UpdatePlayListDto.schema,
  })
  @Post('/playlist/update')
  async updatePlaylist(
    @GetToken() token: TokenInfo,
    @Body() body: UpdatePlayListDto,
  ) {
    return await this.youtubeService.updatePlayList(
      body.accountId,
      body.id,
      body.title || '',
      body.description,
      body.privacyStatus,
      body.podcastStatus,
    )
  }

  @ApiDoc({
    summary: 'Delete Playlist',
    body: DeletePlayListDto.schema,
  })
  @Post('/playlist/delete')
  async deletePlaylist(
    @GetToken() token: TokenInfo,
    @Body() body: DeletePlayListDto,
  ) {
    return await this.youtubeService.deletePlaylist(body.accountId, body.id)
  }

  @ApiDoc({
    summary: 'Get Playlist',
    body: GetPlayListDto.schema,
  })
  @Post('/playlist/list')
  async getPlayList(
    @GetToken() token: TokenInfo,
    @Body() body: GetPlayListDto,
  ) {
    return await this.youtubeService.getPlayList(
      body.accountId,
      body.channelId,
      body.id,
      body.mine,
      body.maxResults,
      body.pageToken,
    )
  }

  @ApiDoc({
    summary: 'Insert Playlist Item',
    body: InsertPlayItemsDto.schema,
  })
  @Post('/playlist/items/insert')
  async insertPlayListItems(
    @GetToken() token: TokenInfo,
    @Body() body: InsertPlayItemsDto,
  ) {
    const snippet = {
      playlistId: body.playlistId,
      resourceId: body.resourceId,
      position: body.position,
    }
    const contentDetails = {
      note: body.note,
      startAt: body.startAt,
      endAt: body.endAt,
    }
    return await this.youtubeService.addVideoToPlaylist(
      body.accountId,
      snippet,
      contentDetails,
    )
  }

  @ApiDoc({
    summary: 'Update Playlist Item',
    body: UpdatePlayItemsDto.schema,
  })
  @Post('/playlist/items/update')
  async updatePlayListItems(
    @GetToken() token: TokenInfo,
    @Body() body: UpdatePlayItemsDto,
  ) {
    const snippet = {
      playlistId: body.playlistId,
      resourceId: body.resourceId,
      position: body.position,
    }
    const contentDetails = {
      note: body.note,
      startAt: body.startAt,
      endAt: body.endAt,
    }
    return await this.youtubeService.updatePlayItems(
      body.accountId,
      body.id,
      snippet,
      contentDetails,
    )
  }

  @ApiDoc({
    summary: 'Delete Playlist Item',
    body: DeletePlayItemsDto.schema,
  })
  @Post('/playlist/items/delete')
  async deletePlayListItems(
    @GetToken() token: TokenInfo,
    @Body() body: DeletePlayItemsDto,
  ) {
    return await this.youtubeService.deletePlayItems(
      body.accountId,
      body.id,
    )
  }

  @ApiDoc({
    summary: 'Get Playlist Items',
    body: GetPlayItemsDto.schema,
  })
  @Post('/playlist/items/list')
  async getPlayListItems(
    @GetToken() token: TokenInfo,
    @Body() body: GetPlayItemsDto,
  ) {
    return await this.youtubeService.getPlayItemsList(
      body.accountId,
      body.id,
      body.playlistId,
      body.maxResults,
      body.pageToken,
      body.videoId,
    )
  }

  @ApiDoc({
    summary: 'Get Channel List',
    query: GetChannelsListDto.schema,
  })
  @Get('/channel/list')
  async getChannelsList(
    @GetToken() token: TokenInfo,
    @Query() query: GetChannelsListDto,
  ) {
    return await this.youtubeService.getChannelsList(
      query.accountId,
      query.forHandle,
      query.forUsername,
      query.id?.split(','),
      query.mine,
      query.maxResults,
      query.pageToken,
    )
  }

  @ApiDoc({
    summary: 'Get Channel Sections',
    body: ChannelsSectionsListDto.schema,
  })
  @Post('/channel/sections/list')
  async getChannelsSectionsList(
    @GetToken() token: TokenInfo,
    @Body() body: ChannelsSectionsListDto,
  ) {
    return await this.youtubeService.getChannelSectionsList(
      body.accountId,
      body.channelId,
      body.id?.split(','),
      body.mine,
    )
  }

  @ApiDoc({
    summary: 'Get Common Parameters',
  })
  @Get('/common/params')
  async getCommonParams(
    @GetToken() _token: TokenInfo,
  ) {
    return await this.youtubeService.getCommonParams()
  }

  @ApiDoc({
    summary: 'Update Channel ID',
  })
  @Get('/channel/update/channelId/:accountId')
  async updateChannelId(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
  ) {
    return await this.youtubeService.updateChannelId(accountId)
  }

  @Public()
  @ApiDoc({
    summary: 'Search Content',
    body: SearchDto.schema,
  })
  @Post('/search')
  async search(
    @Body() body: SearchDto,
  ) {
    const publishedBefore = body.publishedBefore
      ? new Date(body.publishedBefore)
      : undefined
    const publishedAfter = body.publishedAfter
      ? new Date(body.publishedAfter)
      : undefined

    return await this.youtubeService.getSearchList(
      body.accountId,
      body.forMine,
      body.maxResults,
      body.order,
      body.pageToken,
      publishedBefore,
      publishedAfter,
      body.q,
      body.type,
      body.videoCategoryId,
    )
  }

  @Public()
  @ApiDoc({
    summary: 'Get Channels List (Crawler)',
    body: GetChannelsListDto.schema,
  })
  @Post('/getChannelsList')
  async getCrawlerChannelsList(@Body() body: GetChannelsListDto) {
    return await this.youtubeService.getChannelsList(
      body.accountId,
      body.forHandle,
      body.forUsername,
      body.id?.split(','),
      body.mine,
      body.maxResults,
      body.pageToken,
    )
  }

  @Public()
  @ApiDoc({
    summary: 'Get Videos List (Crawler)',
    body: VideosListDto.schema,
  })
  @Post('/getVideosList')
  async getCrawlerVideosList(@Body() body: VideosListDto) {
    return await this.youtubeService.getVideosList(
      body.accountId,
      body.chart,
      body.id?.split(','),
      body.myRating,
      body.maxResults,
      body.pageToken,
    )
  }

  @Public()
  @ApiDoc({
    summary: 'Refresh Token (Crawler)',
    body: AccountIdDto.schema,
  })
  @Post('/refreshToken')
  async crawlerRefreshToken(@Body() body: AccountIdDto) {
    return await this.youtubeService.getUserAccessToken(body.accountId)
  }
}

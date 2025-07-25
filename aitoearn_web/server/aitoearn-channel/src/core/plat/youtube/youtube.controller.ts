import {
  Controller,
  Get,
  Logger,
  Query,
} from '@nestjs/common'

import { Payload } from '@nestjs/microservices'
import { ApiTags } from '@nestjs/swagger'
import { NatsMessagePattern } from '@/common'

import {
  AccountIdDto,
  ChannelsSectionsListDto,
  CreateAccountAndSetAccessTokenDto,
  DeleteCommentDto,
  DeletePlayItemsDto,
  DeletePlayListDto,
  DeleteVideoDto,
  GetAuthInfoDto,
  GetAuthUrlDto,
  GetChannelsListDto,
  GetCommentsListDto,
  GetCommentThreadsListDto,
  GetPlayItemsDto,
  GetPlayListDto,
  GetVideoRateDto,
  InitUploadVideoDto,
  InsertCommentDto,
  InsertCommentThreadsDto,
  InsertPlayItemsDto,
  InsertPlayListDto,
  SetCommentThreadsModerationStatusDto,
  UpdateCommentDto,
  UpdatePlayItemsDto,
  UpdatePlayListDto,
  UpdateVideoDto,
  UploadVideoDto,
  UploadVideoPartDto,
  VideoCategoriesDto,
  VideoCompleteDto,
  VideoRateDto,
  VideosListDto,
} from './dto/youtube.dto'

import { YoutubeService } from './youtube.service'

@ApiTags('youtube - Youtube平台')
@Controller('youtube')
export class YoutubeController {
  private readonly logger = new Logger(YoutubeController.name)

  constructor(
    private readonly youtubeService: YoutubeService,
  ) {}

  // 获取AccessToken,并记录到用户，给平台回调用
  @Get('auth/callback')
  async getAccessToken(
    @Query()
    query: {
      code: string
      state: string
    },
  ) {
    // const { taskId, prefix } = JSON.parse(decodeURIComponent(query.state));
    const stateData = JSON.parse(decodeURIComponent(query.state))
    this.logger.log('stateData-----:', stateData)
    const taskId = stateData.originalState // Use originalState as taskId
    // const prefix = stateData.prefix
    const rcode = query.code
    // this.logger.log('taskId:--', taskId, rcode)
    const res = await this.youtubeService.setAccessToken(
      taskId,
      rcode,
    )
    return res
  }

  // 获取页面的认证URL
  @NatsMessagePattern('plat.youtube.authUrl')
  getAuthUrl(@Payload() data: GetAuthUrlDto) {
    const res = this.youtubeService.getAuthUrl(
      data.userId,
      data.mail,
      data.type,
      data.prefix,
    )
    return res
  }

  // 查询用户的认证信息
  @NatsMessagePattern('plat.youtube.getAuthInfo')
  getAuthInfo(@Payload() data: GetAuthInfoDto) {
    const res = this.youtubeService.getAuthInfo(data.taskId)
    return res
  }

  // 查询账号的认证信息
  @NatsMessagePattern('plat.youtube.getAccountAuthInfo')
  getAccountAuthInfo(@Payload() data: AccountIdDto) {
    const res = this.youtubeService.getUserAccessToken(data.accountId)
    return res
  }

  // 设置授权Token
  @NatsMessagePattern('plat.youtube.setAccessToken')
  async setAccessToken(@Payload() data: CreateAccountAndSetAccessTokenDto) {
    this.logger.log('channel:--setAccessToken:', data.taskId, data.code)
    const res = await this.youtubeService.setAccessToken(data.taskId, data.code)
    return res
  }

  // 创建账号并设置授权Token
  @NatsMessagePattern('plat.youtube.createAccountAndSetAccessToken')
  async createAccountAndSetAccessToken(
    @Payload() data: CreateAccountAndSetAccessTokenDto,
  ) {
    const res = await this.youtubeService.createAccountAndSetAccessToken(
      data.taskId,
      {
        code: data.code,
        state: data.state,
      },
    )
    return res
  }

  // 查询账号是否授权
  @NatsMessagePattern('plat.youtube.isAuthorized')
  isAuthorized(@Payload() data: AccountIdDto) {
    const res = this.youtubeService.isAuthorized(data.accountId)
    return res
  }

  // 刷新令牌token
  @NatsMessagePattern('plat.youtube.refreshToken')
  refreshToken(@Payload() data: AccountIdDto) {
    const res = this.youtubeService.getUserAccessToken(data.accountId)
    return res
  }

  // 获取视频类别
  @NatsMessagePattern('plat.youtube.getVideoCategories')
  getVideoCategories(@Payload() data: VideoCategoriesDto) {
    const res = this.youtubeService.getVideoCategoriesList(
      data.accountId,
      data?.id,
      data?.regionCode,
    )
    return res
  }

  // 获取视频列表
  @NatsMessagePattern('plat.youtube.getVideosList')
  getVideosList(@Payload() data: VideosListDto) {
    const res = this.youtubeService.getVideosList(
      data.accountId,
      data?.chart,
      data?.id?.split(','),
      data?.myRating,
      data?.maxResults,
      data?.pageToken,
    )
    return res
  }

  // 视频上传(20M以下小视频)
  @NatsMessagePattern('plat.youtube.uploadVideo')
  async uploadVideo(@Payload() data: UploadVideoDto) {
    this.logger.log('接收到上传视频请求:', data.accountId, data.fileName)

    const res = this.youtubeService.uploadVideo(
      data.accountId,
      data.fileBuffer,
      data.fileName,
      data.title,
      data.description,
      data.privacyStatus,
      data.keywords,
      data.categoryId,
      data.publishAt,
    )
    return res
  }

  // 初始化分片上传会话
  @NatsMessagePattern('plat.youtube.initVideoUpload')
  async initVideoUpload(@Payload() data: InitUploadVideoDto) {
    this.logger.log('接收到初始化视频上传请求:', {
      accountId: data.accountId,
      title: data.title,
      contentLength: data.contentLength,
    })
    const res = await this.youtubeService.initVideoUpload(
      data.accountId,
      data.title,
      data.description || '',
      data.tag ? data.tag.split(',') : [],
      data.categoryId || '22',
      data.privacyStatus || 'public',
      data.publishAt,
      data.contentLength,
    )
    return res
  }

  // 上传视频分片
  @NatsMessagePattern('plat.youtube.uploadVideoPart')
  async uploadVideoPart(@Payload() data: UploadVideoPartDto) {
    try {
      this.logger.log('接收到上传视频分片请求:', {
        accountId: data.accountId,
        partNumber: data.partNumber,
        hasFileBase64: !!data.fileBase64,
        fileBase64Length: data.fileBase64 ? data.fileBase64.length : 0,
      })

      // 处理文件数据 - 解码Base64字符串
      if (!data.fileBase64) {
        this.logger.error('文件数据未传输成功，收到undefined')
        return false
      }

      // 将Base64字符串转换为Buffer
      const fileBuffer = Buffer.from(data.fileBase64, 'base64')

      // DTO已经通过@Type(() => Number)处理了类型转换
      this.logger.log(
        `处理分片 ${data.partNumber}, Base64长度: ${data.fileBase64.length}, 解码后大小: ${fileBuffer.length} 字节`,
      )

      const res = await this.youtubeService.uploadVideoPart(
        data.accountId,
        fileBuffer,
        data.uploadToken,
        data.partNumber,
      )

      return res
    }
    catch (error) {
      this.logger.error('处理视频分片失败:', error)
      return error
    }
  }

  // 视频分片合并
  @NatsMessagePattern('plat.youtube.videoComplete')
  async videoComplete(@Payload() data: VideoCompleteDto) {
    try {
      this.logger.log('接收到视频完成请求:', {
        accountId: data.accountId,
        totalSize: data.totalSize,
      })

      const res = await this.youtubeService.videoComplete(
        data.accountId,
        data.uploadToken,
        data.totalSize,
      )

      return res
    }
    catch (error) {
      this.logger.error('完成视频上传失败:', error)
      return error
    }
  }

  // 创建顶级评论（评论会话）
  @NatsMessagePattern('plat.youtube.insertCommentThreads')
  async createTopComment(@Payload() data: InsertCommentThreadsDto) {
    try {
      const res = await this.youtubeService.insertCommentThreads(
        data.accountId,
        data.channelId,
        data.videoId,
        data.textOriginal,
      )

      return res
    }
    catch (error) {
      this.logger.error('创建顶级评论失败:', error)
      return error
    }
  }

  // 获取评论会话列表
  @NatsMessagePattern('plat.youtube.getCommentThreadsList')
  async getCommentThreadsList(@Payload() data: GetCommentThreadsListDto) {
    try {
      const res = await this.youtubeService.getCommentThreadsList(
        data.accountId,
        data?.allThreadsRelatedToChannelId,
        data?.id?.split(',') || [],
        data?.videoId,
        data?.maxResults,
        data?.pageToken,
        data?.order,
        data?.searchTerms,
      )

      return res
    }
    catch (error) {
      this.logger.error('获取评论会话列表失败:', error)
      return error
    }
  }

  // 获取子评论列表
  @NatsMessagePattern('plat.youtube.getCommentsList')
  async getCommentsList(@Payload() data: GetCommentsListDto) {
    try {
      const res = await this.youtubeService.getCommentsList(
        data.accountId,
        data?.parentId,
        data?.id.split(','),
        data?.maxResults || 5,
        data?.pageToken,
      )

      return res
    }
    catch (error) {
      this.logger.error('获取评论列表失败:', error)
      return error
    }
  }

  // 创建二级评论
  @NatsMessagePattern('plat.youtube.insertComment')
  async createSubComment(@Payload() data: InsertCommentDto) {
    try {
      const res = await this.youtubeService.insertComment(
        data.accountId,
        data.parentId,
        data.textOriginal,
      )
      return res
    }
    catch (error) {
      this.logger.error('创建二级评论失败:', error)
      return error
    }
  }

  // 更新评论
  @NatsMessagePattern('plat.youtube.updateComment')
  async updateComment(@Payload() data: UpdateCommentDto) {
    try {
      const res = await this.youtubeService.updateComment(
        data.accountId,
        data.id,
        data.textOriginal,
      )
      return res
    }
    catch (error) {
      this.logger.error('更新评论失败:', error)
      return error
    }
  }

  // 设置一条或多条评论的审核状态。
  @NatsMessagePattern('plat.youtube.setModerationStatusComments')
  async setModerationStatusComments(@Payload() data: SetCommentThreadsModerationStatusDto) {
    try {
      const res = await this.youtubeService.setModerationStatusComments(
        data.accountId,
        data.id.split(','),
        data.moderationStatus,
        data?.banAuthor || false,
      )
      return res
    }
    catch (error) {
      this.logger.error('设置评论审核状态失败:', error)
      return error
    }
  }

  // 删除评论
  @NatsMessagePattern('plat.youtube.deleteComment')
  async deleteComment(@Payload() data: DeleteCommentDto) {
    try {
      const res = await this.youtubeService.deleteComment(
        data.accountId,
        data.id,
      )
      return res
    }
    catch (error) {
      this.logger.error('删除评论失败:', error)
      return error
    }
  }

  // 对视频的点赞、踩
  @NatsMessagePattern('plat.youtube.setVideoRate')
  async rateVideo(@Payload() data: VideoRateDto) {
    try {
      const res = await this.youtubeService.setVideosRate(
        data.accountId,
        data.id,
        data.rating,
      )
      return res
    }
    catch (error) {
      this.logger.error('对视频的点赞、踩失败:', error)
      return error
    }
  }

  // 获取视频的点赞、踩
  @NatsMessagePattern('plat.youtube.getVideoRate')
  async getVideoRate(@Payload() data: GetVideoRateDto) {
    try {
      const res = await this.youtubeService.getVideosRating(
        data.accountId,
        data.id.split(','),
      )
      return res
    }
    catch (error) {
      this.logger.error('获取视频的点赞、踩失败:', error)
      return error
    }
  }

  // 删除视频
  @NatsMessagePattern('plat.youtube.deleteVideo')
  async deleteVideo(@Payload() data: DeleteVideoDto) {
    try {
      const res = await this.youtubeService.deleteVideo(
        data.accountId,
        data.id,
      )
      return res
    }
    catch (error) {
      this.logger.error('删除视频失败:', error)
      return error
    }
  }

  // 更新视频
  @NatsMessagePattern('plat.youtube.updateVideo')
  async updateVideo(@Payload() data: UpdateVideoDto) {
    try {
      const snippet = {
        title: data.title,
        categoryId: data.categoryId,
        description: data?.description,
        tags: data?.tags?.split(','),
        defaultLanguage: data?.defaultLanguage,

      }

      const recordingDetails = {
        recordingDate: data?.recordingDate,
      }

      const status = {
        privacyStatus: data?.privacyStatus,
        publishAt: data?.publishAt,
      }

      const res = await this.youtubeService.updateVideo(
        data.accountId,
        data.id,
        snippet,
        status,
        recordingDetails,
      )
      return res
    }
    catch (error) {
      this.logger.error('更新视频失败:', error)
      return error
    }
  }

  // 创建播放列表
  @NatsMessagePattern('plat.youtube.insertPlayList')
  async insertPlayList(@Payload() data: InsertPlayListDto) {
    try {
      const snippet = {
        title: data.title,
        description: data?.description,
      }

      const status = {
        privacyStatus: data?.privacyStatus,
      }

      const res = await this.youtubeService.insertPlayList(
        data.accountId,
        snippet,
        status,
      )
      return res
    }
    catch (error) {
      this.logger.error('插入播放列表失败:', error)
      return error
    }
  }

  // 获取播放列表
  @NatsMessagePattern('plat.youtube.getPlayList')
  async getPlayList(@Payload() data: GetPlayListDto) {
    try {
      const res = await this.youtubeService.getPlayList(
        data.accountId,
        data.channelId,
        data.id,
        data.mine,
        data.maxResults,
        data.pageToken,
      )
      return res
    }
    catch (error) {
      this.logger.error('获取播放列表失败:', error)
      return error
    }
  }

  // 更新播放列表
  @NatsMessagePattern('plat.youtube.updatePlayList')
  async updatePlayList(@Payload() data: UpdatePlayListDto) {
    try {
      const res = await this.youtubeService.updatePlayList(
        data.accountId,
        data.id,
        data.title,
        data.description,
        data.privacyStatus,
        data.podcastStatus,
      )
      return res
    }
    catch (error) {
      this.logger.error('更新播放列表项失败:', error)
      return error
    }
  }

  // 删除播放列表
  @NatsMessagePattern('plat.youtube.deletePlayList')
  async deletePlayList(@Payload() data: DeletePlayListDto) {
    try {
      const res = await this.youtubeService.deletePlaylist(
        data.accountId,
        data.id,
      )
      return res
    }
    catch (error) {
      this.logger.error('删除播放列表失败:', error)
      return error
    }
  }

  // 将视频添加到播放列表中
  @NatsMessagePattern('plat.youtube.addVideoToPlaylist')
  async addVideoToPlaylist(@Payload() data: InsertPlayItemsDto) {
    const snippet = {
      playlistId: data.playlistId,
      resourceId: data.resourceId,
      position: data?.position,
    }

    const contentDetails = {
      note: data?.note,
      startAt: data?.startAt,
      endAt: data?.endAt,
    }

    try {
      const res = await this.youtubeService.addVideoToPlaylist(
        data.accountId,
        snippet,
        contentDetails,
      )
      return res
    }
    catch (error) {
      this.logger.error('将视频添加到播放列表中失败:', error)
      return error
    }
  }

  // 获取播放列表项
  @NatsMessagePattern('plat.youtube.getPlayItems')
  async getPlayItems(@Payload() data: GetPlayItemsDto) {
    try {
      const res = await this.youtubeService.getPlayItemsList(
        data.accountId,
        data.id,
        data.playlistId,
        data.maxResults,
        data.pageToken,
        data.videoId,
      )
      return res
    }
    catch (error) {
      this.logger.error('获取播放列表项失败:', error)
      return error
    }
  }

  // 插入播放列表项
  @NatsMessagePattern('plat.youtube.insertPlayItems')
  async insertPlayItems(@Payload() data: InsertPlayItemsDto) {
    try {
      const res = await this.youtubeService.insertPlayItems(
        data.accountId,
        data.playlistId,
        data.resourceId,
        data.position,
        data.note,
      )
      return res
    }
    catch (error) {
      this.logger.error('插入播放列表项失败:', error)
      return error
    }
  }

  // 更新播放列表项
  @NatsMessagePattern('plat.youtube.updatePlayItems')
  async updatePlayItems(@Payload() data: UpdatePlayItemsDto) {
    try {
      const snippet = {
        playlistId: data.playlistId,
        resourceId: data.resourceId,
        position: data?.position,
      }

      const contentDetails = {
        note: data?.note,
        startAt: data?.startAt,
        endAt: data?.endAt,
      }

      const res = await this.youtubeService.updatePlayItems(
        data.accountId,
        data.id,
        snippet,
        contentDetails,
      )
      return res
    }
    catch (error) {
      this.logger.error('更新播放列表项失败:', error)
      return error
    }
  }

  // 删除播放列表项
  @NatsMessagePattern('plat.youtube.deletePlayItems')
  async deletePlayItems(@Payload() data: DeletePlayItemsDto) {
    try {
      const res = await this.youtubeService.deletePlayItems(
        data.accountId,
        data.id,
      )
      return res
    }
    catch (error) {
      this.logger.error('删除播放列表项失败:', error)
      return error
    }
  }

  // 获取频道列表
  @NatsMessagePattern('plat.youtube.getChannelsList')
  async getChannelsList(@Payload() data: GetChannelsListDto) {
    try {
      const res = await this.youtubeService.getChannelsList(
        data.accountId,
        data?.forHandle || '',
        data?.forUsername || '',
        data?.id?.split(',') || [],
        data?.mine || false,
        data?.maxResults || 5,
        data?.pageToken || '',
      )

      return res
    }
    catch (error) {
      this.logger.error('获取频道列表失败:', error)
      return error
    }
  }

  // 更新频道
  // @NatsMessagePattern('plat.youtube.updateChannels')
  // async updateChannels(@Payload() data: UpdateChannelsDto) {
  //   try {
  //     const res = await this.youtubeService.updateChannels(
  //       data.accountId,
  //       data.id,
  //       data.brandingSettings.channel.country,
  //       data.contentDetails,
  //       data.innertubeMetadata,
  //       data.localizations,
  //       data.statistics,
  //       data.status,
  //       data.topicDetails,
  //       data.contentOwnerDetails,
  //       data.defaultLanguage,
  //       data.defaultAudioLanguage,
  //       data.description,
  //       data.keywords,
  //       data.privacyStatus,
  //       data.publishedAt,
  //       data.signatureTimestamp,
  //       data.signatureVersion,
  //       data.signaturePublicKey,
  //       data.signature,
  //     )
  //     return res
  //   }
  //   catch (error) {
  //     this.logger.error('更新频道失败:', error)
  //     return error
  //   }
  // }

  // // 创建频道板块
  // @NatsMessagePattern('plat.youtube.insertChannelsSections')
  // async insertChannelsSections(@Payload() data: InsertChannelsSectionsDto) {
  //   try {
  //     const res = await this.youtubeService.insertChannelsSections(
  //       data.accountId,
  //       data.channelId,
  //       data.title,
  //       data.position,
  //       data.customUrl,
  //       data.defaultLanguage,
  //       data.defaultAudioLanguage,
  //       data.description,
  //       data.keywords,
  //       data.privacyStatus,
  //       data.publishedAt,
  //       data.signatureTimestamp,
  //       data.signatureVersion,
  //       data.signaturePublicKey,
  //       data.signature,
  //     )
  //     return res
  //   }
  //   catch (error) {
  //     this.logger.error('创建频道板块失败:', error)
  //     return error
  //   }
  // }

  // 获取频道板块列表
  @NatsMessagePattern('plat.youtube.getChannelsSectionsList')
  async getChannelsSectionsList(@Payload() data: ChannelsSectionsListDto) {
    try {
      const res = await this.youtubeService.getChannelSectionsList(
        data.accountId,
        data?.channelId,
        data?.id?.split(','),
        data?.mine,
      )
      return res
    }
    catch (error) {
      this.logger.error('获取频道板块列表失败:', error)
      return error
    }
  }

  // // 更新频道板块
  // @NatsMessagePattern('plat.youtube.updateChannelsSections')
  // async updateChannelsSections(@Payload() data: UpdateChannelsSectionsDto) {
  //   try {
  //     const res = await this.youtubeService.updateChannelsSections(
  //       data.accountId,
  //       data.id,
  //       data.channelId,
  //       data.title,
  //       data.position,
  //       data.customUrl,
  //       data.defaultLanguage,
  //       data.defaultAudioLanguage,
  //       data.description,
  //       data.keywords,
  //       data.privacyStatus,
  //       data.publishedAt,
  //       data.signatureTimestamp,
  //       data.signatureVersion,
  //       data.signaturePublicKey,
  //       data.signature,
  //     )
  //     return res
  //   }
  //   catch (error) {
  //     this.logger.error('更新频道板块失败:', error)
  //     return error
  //   }
  // }

  // // 删除频道板块
  // @NatsMessagePattern('plat.youtube.deleteChannelsSections')
  // async deleteChannelsSections(@Payload() data: DeleteChannelsSectionsDto) {
  //   try {
  //     const res = await this.youtubeService.deleteChannelsSections(
  //       data.accountId,
  //       data.id,
  //     )
  //     return res
  //   }
  //   catch (error) {
  //     this.logger.error('删除频道板块失败:', error)
  //     return error
  //   }
  // }
}

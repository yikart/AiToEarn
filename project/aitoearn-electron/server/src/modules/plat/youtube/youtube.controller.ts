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
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AccessBackDto,
  ArchiveAddByUtokenBodyDto,
  ArchiveAddByUtokenQueryDto,
} from './dto/youtube.dto';
import { YoutubeService } from './youtube.service';
import { GoogleService } from '../google/google.service';
import { GetToken, Public } from 'src/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { YouTubeAuthService } from './youtube.auth.service';
import { Response } from 'express';

@ApiTags('plat/youtube - Youtube平台')
@Controller('plat/youtube')
export class YoutubeController {
  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly youtubeAuthService: YouTubeAuthService,
    ) {}

  @ApiOperation({ summary: '测试' })
  @Public()
  @Get('test')
  async getTest() {
    const res = "success";
    return res;
  }

  @ApiOperation({ summary: '获取YouTube授权URL' })
  @Get('auth/url')
  async getAuthUrl(
    @GetToken() systemToken: TokenInfo,
    @Query('mail') mail: string) {
    if (!mail) {
      throw new BadRequestException('邮箱参数不能为空');
    }
  // async getAuthUrl(@GetToken() token: TokenInfo) {
  //   // mail = token.id
  //   // if (!mail) {
  //   //   throw new BadRequestException('邮箱参数不能为空');
  //   // }

    return this.youtubeAuthService.getAuthorizationUrl(mail, systemToken.id);
  }

  @ApiOperation({ summary: '处理YouTube授权回调' })
  @Public()
  @Get('auth/callback')
  async handleAuthCallback(
    // @GetToken() systemToken: TokenInfo,
    @Query('code') code: string,
    @Query('state') state: string,
    // @Query('userId') userId: string,
    @Res() res: Response
  ) {

    if (!code || !state) {
      throw new BadRequestException('授权参数不完整');
    }
      // 解析state参数以获取token
      let stateData;
      try {
        stateData = JSON.parse(decodeURIComponent(state));
      } catch (error) {
        throw new BadRequestException('无效的state参数');
      }

      const { originalState, userId, email } = stateData;

      // 现在您可以使用token变量
      console.log('Retrieved userId and originalState:', userId, originalState, email);

    try {
      const results = await this.youtubeAuthService.handleAuthorizationCode(code, originalState, userId);
      // 重定向到前端页面，带上token
      // return res.redirect(`/auth/success?token=${token}`);
      // return results
      const render_msg = {
        message: "授权成功！ 这里是添加账号成功后的前端页面，" ,
        datas: results
      };

      return res.render('google/index', render_msg);

    } catch (error) {
      console.error('授权失败:', error);
      // return res.redirect('/auth/error?message=授权失败');
      return false
    }
  }

  @ApiOperation({ summary: '检查是否已授权YouTube' })
  @Get('auth/check')
  async checkAuth(
    @GetToken() systemToken: TokenInfo,
    @Query('accountId') accountId: string,
    ) {
    // return {
    //   authorized: await this.youtubeAuthService.isAuthorized(systemToken.id)
    // };
    return await this.youtubeAuthService.isAuthorized(accountId)

  }

  @ApiOperation({ summary: '撤销YouTube授权' })
  @Post('auth/revoke')
  async revokeAuth(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    ) {
    const result = await this.youtubeAuthService.revokeAuthorization(accountId);
    return result
  }


  @ApiOperation({ summary: '获取频道列表' })
  @Get('channels/list')
  async getChannelsList(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('handle') handle?: string,
    @Query('userName') userName?: string,
    @Query('id') id?: string,
    @Query('mine') mine?: boolean
    ) {
    // 校验确保只有一个参数传递
    const params = [handle, userName, id, mine];
    const nonEmptyParams = params.filter(param => param !== undefined && param !== null && param !== '');

    if (nonEmptyParams.length > 1) {
      throw new BadRequestException('只能选择一个参数: handle, userName, id 或 mine');
    }
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);

    return this.youtubeService.getChannelsList(accessToken, handle, userName, id, mine);
  }

  @ApiOperation({ summary: '更新频道' })
  @Post('channels/update')
  async channelsUpdate(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('id') id: string,
    @Body('brandingSettings') brandingSettings?: Record<string, any>,
    @Body('status') status?: Record<string, any>,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.updateChannels(accessToken, id, brandingSettings, status);
  }

  @ApiOperation({ summary: '获取频道板块列表' })
  @Get('channels/sections/list')
  async getChannelSectionsList(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('channelId') channelId?: string,
    @Query('id') id?: string,
    @Query('maxResults') maxResults?: string,
    @Query('mine') mine?: boolean,
    @Query('pageToken') pageToken?: string,
    ) {
    // 校验确保只有一个参数传递
    const params = [channelId, id, mine];
    const nonEmptyParams = params.filter(param => param !== undefined && param !== null && param !== '');

    if (nonEmptyParams.length > 1) {
      throw new BadRequestException('只能选择一个参数: channelId, id, mine');
    }
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.getChannelSectionsList(accessToken, channelId, id, mine, maxResults, pageToken);
  }

  @ApiOperation({ summary: '创建频道板块' })
  @Post('channels/sections/insert')
  async channelsSectionsInsert(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('snippet') snippet?: Record<string, any>,
    @Body('contentDetails') contentDetails?: Record<string, any>,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.insertChannelSection(accessToken, snippet, contentDetails);
  }

  @ApiOperation({ summary: '更新频道版块' })
  @Post('channels/sections/update')
  async channelsSectionsUpdate(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId,
    @Body('snippet') snippet?: Record<string, any>,
    @Body('contentDetails') contentDetails?: Record<string, any>,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.updateChannelSection(accessToken, snippet, contentDetails);
  }

  @ApiOperation({ summary: '删除频道版块' })
  @Post('channels/sections/delete')
  async channelsSectionsDelete(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('id') channelSectionId: string,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.deleteChannelsSections(accessToken, channelSectionId);
  }

  @ApiOperation({ summary: '获取评论列表' })
  @Get('comments/list')
  async getCommentsList(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('parentId') parentId: string,
    @Query('id') id: string,
    @Query('maxResults') maxResults?: string,
    @Query('pageToken') pageToken?: string,
    ) {
    // 校验确保只有一个参数传递
    const params = [parentId, id];
    const nonEmptyParams = params.filter(param => param !== undefined && param !== null && param !== '');

    if (nonEmptyParams.length > 1) {
      throw new BadRequestException('只能选择一个参数: channelId, id, mine');
    }
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.getCommentsList(accessToken, parentId, id, maxResults, pageToken);
  }

  @ApiOperation({ summary: '创建对现有评论的回复' })
  @Post('comments/insert')
  async commentsInsert(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('snippet') snippet: Record<string, any>,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.insertComment(accessToken, snippet);
  }

  @ApiOperation({ summary: '修改评论' })
  @Post('comments/update')
  async commentsUpdate(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('snippet') snippet: Record<string, any>,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.updateComments(accessToken, snippet);
  }

  @ApiOperation({ summary: '设置一条或多条评论的审核状态' })
  @Post('comments/setModerationStatus')
  async commentsSetModerationStatus(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('id') id: string,
    @Body('moderationStatus') moderationStatus: string,
    @Body('banAuthor') banAuthor?: boolean
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.setModerationStatusComments(accessToken, id, moderationStatus, banAuthor);
  }

  @ApiOperation({ summary: '删除评论' })
  @Post('comments/delete')
  async commentsDelete(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('id') id: string,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.deleteComments(accessToken, id);
  }

  @ApiOperation({ summary: '获取评论会话列表' })
  @Get('commentThreads/list')
  async getCommentThreadsList(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('allThreadsRelatedToChannelId') allThreadsRelatedToChannelId: string,
    @Query('id') id: string,
    @Query('videoId') videoId: string,
    @Query('order') order?: string,
    @Query('searchTerms') searchTerms?: string,
    @Query('maxResults') maxResults?: string,
    @Query('pageToken') pageToken?: string,
    ) {
    // 校验确保只有一个参数传递
    const params = [allThreadsRelatedToChannelId, id, videoId];
    const nonEmptyParams = params.filter(param => param !== undefined && param !== null && param !== '');

    if (nonEmptyParams.length > 1) {
      throw new BadRequestException('只能选择一个参数: allThreadsRelatedToChannelId, id, videoId');
    }
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.getCommentThreadsList(accessToken, allThreadsRelatedToChannelId, id, videoId, maxResults, pageToken, order, searchTerms);
  }

  @ApiOperation({ summary: '创建顶级评论' })
  @Post('commentThreads/insert')
  async commentThreadsInsert(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('snippet') snippet: Record<string, any>,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.insertCommentThreads(accessToken, snippet);
  }

  @ApiOperation({ summary: '获取视频类别列表' })
  @Get('video/categories/list')
  async getVideoCategoriesList(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('regionCode') regionCode?: string,
    @Query('id') id?: string
    ) {
    // 校验确保只有一个参数传递
    const params = [regionCode, id];
    const nonEmptyParams = params.filter(param => param !== undefined && param !== null && param !== '');

    if (nonEmptyParams.length > 1) {
      throw new BadRequestException('只能选择一个参数: regionCode, id');
    }
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.getVideoCategoriesList(accessToken, id, regionCode);
  }

  @ApiOperation({ summary: '获取视频列表' })
  @Get('videos/list')
  async getVideosList(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('id') id?: string,
    @Query('myRating') myRating?: string,
    @Query('maxResults') maxResults?: string,
    @Query('pageToken') pageToken?: string,
    ) {
    // 校验确保只有一个参数传递
    const params = [id, myRating];
    const nonEmptyParams = params.filter(param => param !== undefined && param !== null && param !== '');

    if (nonEmptyParams.length > 1) {
      throw new BadRequestException('只能选择一个参数: id, myRating');
    }
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.getVideosList(accessToken, id, myRating, maxResults, pageToken);
  }

  @ApiOperation({ summary: '视频上传' })
  @UseInterceptors(FileInterceptor('file'))
  @Post('videos/upload')
  async videoUpload(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('keywords') keywords?: string,
    @Body('categoryId') categoryId?: string,
    @Body('privacyStatus') privacyStatus?: string,
    @Body('publishAt') publishAt?: Date
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.uploadVideo(token.id, accountId, accessToken, file, title, description, keywords, categoryId, privacyStatus, publishAt);
  }

  @ApiOperation({ summary: '视频删除' })
  @Post('videos/delete')
  async videoDelete(
    @GetToken() token: TokenInfo,
    @Body('id') videoId: string,
    @Body('accountId') accountId: string,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.deleteVideo(accessToken, videoId);
  }

  @ApiOperation({ summary: '更新视频' })
  @Post('videos/update')
  async videoUpdate(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('id') videoId: string,
    @Body('snippet') snippet?: Record<string, any>,
    @Body('status') status?: Record<string, any>,
    @Body('recordingDetails') recordingDetails?: Record<string, any>,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.updateVideo(accessToken, videoId, snippet, status, recordingDetails);
  }

  @ApiOperation({ summary: '创建播放列表' })
  @Post('playlist/insert')
  async playlistInsert(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('snippet') snippet?: Record<string, any>,
    @Body('status') status?: Record<string, any>,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.insertPlayList(accessToken, snippet, status);
  }

  @ApiOperation({ summary: '获取播放列表' })
  @Get('playlist/list')
  async getPlayList(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('channelId') channelId?: string,
    @Query('id') playListIds?: string,
    @Query('mine') mine?: boolean,
    @Query('maxResults') maxResults?: string,
    @Query('pageToken') pageToken?: string,
    ) {
    // 校验确保只有一个参数传递
    const params = [channelId, playListIds, mine];
    const nonEmptyParams = params.filter(param => param !== undefined && param !== null && param !== '');

    if (nonEmptyParams.length > 1) {
      throw new BadRequestException('只能选择一个参数: channelId, playListIds, mine');
    }
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.getPlayList(accessToken, channelId, playListIds, mine, maxResults, pageToken);
  }

  @ApiOperation({ summary: '更新播放列表' })
  @Post('playlist/update')
  async playlistUpdate(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('playListId') playListId: string,
    @Body('snippet') snippet?: Record<string, any>,
    @Body('status') status?: Record<string, any>,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.updatePlayList(accessToken, playListId, snippet, status);
  }

  @ApiOperation({ summary: '删除播放列表' })
  @Post('playlist/delete')
  async playlistDelete(
    @GetToken() token: TokenInfo,
    @Body('id') playListId: string,
    @Body('accountId') accountId: string,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.deletePlaylist(accessToken, playListId);
  }

  @ApiOperation({ summary: '获取播放列表项' })
  // @Public()
  @Get('playlist/items/list')
  async getPlayItemsList(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('playlistId') playlistId: string,
    @Query('id') playlistItemsIds: string,
    @Query('maxResults') maxResults?: string,
    @Query('pageToken') pageToken?: string,
    ) {
    // 校验确保只有一个参数传递
    const params = [playlistId, playlistItemsIds];
    const nonEmptyParams = params.filter(param => param !== undefined && param !== null && param !== '');

    if (nonEmptyParams.length > 1) {
      throw new BadRequestException('只能选择一个参数: playlistId, playlistItemsIds');
    }
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.getPlayItemsList(accessToken, playlistId, playlistItemsIds, maxResults, pageToken);
  }

  @ApiOperation({ summary: '添加播放列表项' })
  @Post('playlist/items/insert')
  async PlayItemsInsert(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('snippet') snippet?: Record<string, any>,
    @Body('contentDetails') contentDetails?: Record<string, any>,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.insertPlayItems(accessToken, snippet, contentDetails);
  }

  @ApiOperation({ summary: '更新播放列表项' })
  @Post('playlist/items/update')
  async playItemsUpdate(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('id') playlistItemsId: string,
    @Body('snippet') snippet?: Record<string, any>,
    @Body('contentDetails') contentDetails?: Record<string, any>,

  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.updatePlayItems(accessToken, playlistItemsId, snippet, contentDetails);
  }

  @ApiOperation({ summary: '删除播放列表项' })
  @Post('playlist/items/delete')
  async playItemsDelete(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('id') playlistItemsId: string,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.deletePlayItems(accessToken, playlistItemsId);
  }

  @ApiOperation({ summary: '视频的点赞、踩' })
  @Post('videos/rate')
  async videosRate(
    @GetToken() token: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('id') videoId: string,
    @Body('rating') rating: string,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.videosRate(accessToken, videoId, rating);
  }

  @ApiOperation({ summary: '获取视频的点赞、踩' })
  @Get('videos/rate/list')
  async getVideosRating(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('id') videoIds: string,
  ) {
    const accessToken = await this.youtubeAuthService.getUserAccessToken(accountId);
    return this.youtubeService.getVideosRating(accessToken, videoIds);
  }

}


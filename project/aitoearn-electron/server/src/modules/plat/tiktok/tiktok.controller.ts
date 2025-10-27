import { Controller, Get, Post, Body, Query, Res, Param, Delete, UseInterceptors, BadRequestException,
  UploadedFile, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Express } from 'express';
import { TikTokService } from './tiktok.service';
import { TikTokAuthService } from './tiktok.auth.service';
import { GetToken, Public, AuthGuard } from 'src/auth/auth.guard';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';
import { CreateVideoDto, TikTokCommentDto, GetVideosQueryDto, TikTokVideoFilterDto, CombinedVideoUploadDto } from './dto/tiktok.dto';
import { Response } from 'express';

@ApiTags('plat/tiktok - TikTok 平台')
@Controller('plat/tiktok')
// @UseGuards(AuthGuard)
export class TikTokController {
  constructor(
    private readonly tikTokService: TikTokService,
    private readonly tikTokAuthService: TikTokAuthService,
  ) {}

  /**
   * 获取TikTok授权URL
   */
  @Get('auth/url')
  @ApiOperation({ summary: '获取TikTok授权URL' })
  @ApiQuery({ name: 'mail', required: false, description: '用户邮箱' })
  async getAuthUrl(
    @GetToken() systemToken: TokenInfo,
    @Query('mail') mail: string,
  ) {
    if (!systemToken.id || !mail) {
      throw new BadRequestException('token和mail是必须的');
    }
    return this.tikTokAuthService.getAuthorizationUrl(systemToken.id, mail);
  }

  /**
   * TikTok OAuth2回调处理
   */

  @ApiOperation({ summary: 'TikTok OAuth2回调处理' })
  @Public()
  @ApiQuery({ name: 'code', type: String, description: 'OAuth2授权码' })
  @ApiQuery({ name: 'state', type: String, description: '状态码' })
  @Get('auth/callback')
  async handleAuthCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('缺少必要的参数');
    }
    console.log(code, state);

    try {
      // 处理授权回调
      const results = await this.tikTokAuthService.handleAuthorizationCallback(code, state);
      const render_msg = {
        message: "授权成功！ 这里是添加账号成功后的前端页面，" ,
        datas: results
      };

      return res.render('google/index', render_msg);
    } catch (error) {
      console.error('处理TikTok授权回调失败:', error.response?.data || error.message);
      throw new BadRequestException(`处理授权回调失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * 检查用户是否已授权TikTok
   */
  @Get('auth/check')
  @ApiOperation({ summary: '检查用户是否已授权TikTok' })
  @ApiQuery({ name: 'accountId', type: String, description: 'TikTok账号ID' })
  async checkAuth(@Query('accountId') accountId: string) {
    if (!accountId) {
      throw new BadRequestException('accountId是必须的');
    }

    const isAuthorized = await this.tikTokAuthService.isAuthorized(accountId);
    return { authorized: isAuthorized };
  }

  /**
   * 撤销TikTok授权
   */
  @Post('auth/revoke')
  @ApiOperation({ summary: '撤销TikTok授权' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'TikTok账号ID' }
      },
      required: ['accountId']
    }
  })
  async revokeAuth(@GetToken() systemToken: TokenInfo, @Body('accountId') accountId: string) {
    if (!accountId) {
      throw new BadRequestException('accountId是必须的');
    }

    const result = await this.tikTokAuthService.revokeAuthorization(accountId);
    return { success: result };
  }

  /**
   * 获取用户视频列表
   */
  @Get('videos/list')
  @ApiOperation({ summary: '获取用户视频列表' })
  async getUserVideos(
    @GetToken() systemToken: TokenInfo,
    @Query() queryDto: GetVideosQueryDto
  ) {
    const userId = systemToken.id;
    if (!queryDto.accountId) {
      throw new BadRequestException('accountId是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(queryDto.accountId);
    return this.tikTokService.getUserVideos(
      accessToken,
      userId,
      queryDto.accountId,
      queryDto.limit,
      queryDto.cursor
    );
  }

  /**
   * 获取视频详情
   */
  @Get('videos/detail')
  @ApiOperation({ summary: '获取视频详情' })
  @ApiQuery({ name: 'videoId', description: '视频ID' })
  @ApiQuery({ name: 'accountId', description: 'TikTok账号ID' })
  async getVideoDetail(
    @Query('videoId') videoId: string,
    @Query('accountId') accountId: string
  ) {
    if (!videoId || !accountId) {
      throw new BadRequestException('videoId和accountId是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(accountId);
    return this.tikTokService.getVideoDetail(accessToken, videoId);
  }

  /**
   * 上传视频
   */
  @Post('videos/upload')
  @ApiOperation({ summary: '上传视频文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
          description: '视频文件'
        }
      },
      required: ['accountId', 'file']
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @GetToken() systemToken: TokenInfo,
    @Body('accountId') accountId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!accountId || !file) {
      throw new BadRequestException('accountId和视频文件是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(accountId);
    return this.tikTokService.uploadVideo(accessToken, file.buffer);
  }

  /**
   * 发布视频
   */
  @Post('videos/publish')
  @ApiOperation({ summary: '发布视频' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'TikTok账号ID' },
        description: { type: 'string', description: '视频描述' },
        videoId: { type: 'string', description: '上传后的视频ID' },
        private: { type: 'boolean', description: '是否为私有视频' },
        hashtags: {
          type: 'array',
          items: { type: 'string' },
          description: '话题标签列表'
        }
      },
      required: ['accountId', 'description', 'videoId']
    }
  })
  async publishVideo(
    @GetToken() systemToken: TokenInfo,
    @Body() createVideoDto: CreateVideoDto,
    @Body('videoId') videoId: string
  ) {
    const userId = systemToken.id;
    if (!createVideoDto.accountId || !videoId) {
      throw new BadRequestException('accountId和videoId是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(createVideoDto.accountId);
    return this.tikTokService.publishVideo(
      accessToken,
      userId,
      createVideoDto.accountId,
      createVideoDto,
      videoId
    );
  }

  /**
   * 删除视频
   */
  @Post('videos/delete')
  @ApiOperation({ summary: '删除视频' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'TikTok账号ID' },
        videoId: { type: 'string', description: '视频ID' }
      },
      required: ['accountId', 'videoId']
    }
  })
  async deleteVideo(
    @GetToken() systemToken: TokenInfo,
    @Body('videoId') videoId: string,
    @Body('accountId') accountId: string
  ) {
    if (!videoId || !accountId) {
      throw new BadRequestException('videoId和accountId是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(accountId);
    return this.tikTokService.deleteVideo(accessToken, videoId);
  }

  /**
   * 获取视频评论
   */
  @Get('videos/:videoId/comments')
  @ApiOperation({ summary: '获取视频评论' })
  @ApiParam({ name: 'videoId', description: '视频ID' })
  @ApiQuery({ name: 'accountId', description: 'TikTok账号ID' })
  @ApiQuery({ name: 'limit', description: '每页结果数', required: false })
  @ApiQuery({ name: 'cursor', description: '分页游标', required: false })
  async getVideoComments(
    @Param('videoId') videoId: string,
    @Query('accountId') accountId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string
  ) {
    if (!videoId || !accountId) {
      throw new BadRequestException('videoId和accountId是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(accountId);
    return this.tikTokService.getVideoComments(accessToken, videoId, limit, cursor);
  }

  /**
   * 发表评论
   */
  @Post('videos/comment')
  @ApiOperation({ summary: '发表评论' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'TikTok账号ID' },
        videoId: { type: 'string', description: '视频ID' },
        text: { type: 'string', description: '评论内容' }
      },
      required: ['accountId', 'videoId', 'text']
    }
  })
  async postComment(
    @GetToken() systemToken: TokenInfo,
    @Body() commentDto: TikTokCommentDto
  ) {
    if (!commentDto.accountId || !commentDto.videoId || !commentDto.text) {
      throw new BadRequestException('accountId, videoId和text是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(commentDto.accountId);
    return this.tikTokService.postComment(accessToken, commentDto);
  }

  /**
   * 删除评论
   */
  @Post('videos/comment/delete')
  @ApiOperation({ summary: '删除评论' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'TikTok账号ID' },
        videoId: { type: 'string', description: '视频ID' },
        commentId: { type: 'string', description: '评论ID' }
      },
      required: ['accountId', 'videoId', 'commentId']
    }
  })
  async deleteComment(
    @GetToken() systemToken: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('videoId') videoId: string,
    @Body('commentId') commentId: string
  ) {
    if (!accountId || !videoId || !commentId) {
      throw new BadRequestException('accountId, videoId和commentId是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(accountId);
    return this.tikTokService.deleteComment(accessToken, videoId, commentId);
  }

  /**
   * 视频点赞或取消点赞
   */
  @Post('videos/rate')
  @ApiOperation({ summary: '视频点赞或取消点赞' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'TikTok账号ID' },
        videoId: { type: 'string', description: '视频ID' },
        rating: { type: 'string', description: '操作类型: like 或 unlike' }
      },
      required: ['accountId', 'videoId', 'rating']
    }
  })
  async rateVideo(
    @GetToken() systemToken: TokenInfo,
    @Body('videoId') videoId: string,
    @Body('accountId') accountId: string,
    @Body('rating') rating: string
  ) {
    const userId = systemToken.id;
    if (!videoId || !userId || !accountId) {
      throw new BadRequestException('videoId, userId和accountId是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(accountId);

    // 在方法开始处验证
    if (!["like", "unlike"].includes(rating)) {
      throw new BadRequestException('参数错误: rating必须为like或unlike');
    }

    // 后续处理
    if (rating === "like") {
      return this.tikTokService.likeVideo(accessToken, userId, accountId, videoId);
    } else {
      return this.tikTokService.unlikeVideo(accessToken, userId, accountId, videoId);
    }
  }

  /**
   * 搜索TikTok视频
   */
  @Get('search')
  @ApiOperation({ summary: '搜索TikTok视频' })
  async searchVideos(
    @GetToken() systemToken: TokenInfo,
    @Query() filterDto: TikTokVideoFilterDto
  ) {
    if (!filterDto.accountId) {
      throw new BadRequestException('accountId是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(filterDto.accountId);
    return this.tikTokService.searchVideos(accessToken, filterDto);
  }

  /**
   * 初始化视频发布（新版API）
   */
  @Post('videos/init-publish')
  @ApiOperation({ summary: '初始化视频发布（新版API）' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'TikTok账号ID' },
        title: { type: 'string', description: '视频标题' },
        description: { type: 'string', description: '视频描述' },
        privacyLevel: { type: 'string', description: '隐私级别', enum: ['PUBLIC', 'PRIVATE', 'FRIENDS'], default: 'PUBLIC' },
        disableComment: { type: 'boolean', description: '是否禁用评论', default: false },
        disableDuet: { type: 'boolean', description: '是否禁用二重奏', default: false },
        disableStitch: { type: 'boolean', description: '是否禁用Stitch', default: false },
        videoCoverTimestampMs: { type: 'number', description: '视频封面时间点（毫秒）' },
        hashtags: { type: 'array', items: { type: 'string' }, description: '话题标签列表' },
        videoSize: { type: 'number', description: '视频大小（字节）' }
      },
      required: ['accountId', 'videoSize']
    }
  })
  async initVideoPublish(
    @GetToken() systemToken: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('videoSize') videoSize: number,
    @Body() videoInfo: {
      title?: string;
      description?: string;
      privacyLevel?: string;
      disableComment?: boolean;
      disableDuet?: boolean;
      disableStitch?: boolean;
      videoCoverTimestampMs?: number;
      hashtags?: string[];
    }
  ) {
    if (!accountId || !videoSize) {
      throw new BadRequestException('accountId和视频大小是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(accountId);
    return this.tikTokService.initVideoPublish(accessToken, videoSize, videoInfo);
  }

  /**
   * 检查视频发布状态（新版API）
   */
  @Post('videos/publish/status')
  @ApiOperation({ summary: '检查视频发布状态' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'TikTok账号ID' },
        publishId: { type: 'string', description: '发布ID' }
      },
      required: ['accountId', 'publishId']
    }
  })
  async checkPublishStatus(
    @GetToken() systemToken: TokenInfo,
    @Body('accountId') accountId: string,
    @Body('publishId') publishId: string
  ) {
    if (!accountId || !publishId) {
      throw new BadRequestException('accountId和publishId是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(accountId);
    return this.tikTokService.checkPublishStatus(accessToken, publishId);
  }

  /**
   * 一键上传并发布视频（新版API三步法）
   */
  @Post('videos/publish')
  @ApiOperation({ summary: '一键上传并发布视频（新版API）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'TikTok账号ID' },
        title: { type: 'string', description: '视频标题' },
        description: { type: 'string', description: '视频描述' },
        privacyStatus: { type: 'string', description: '隐私级别', enum: ['PUBLIC', 'PRIVATE', 'FRIENDS'], default: 'PUBLIC' },
        disableComment: { type: 'boolean', description: '是否禁用评论', default: false },
        disableDuet: { type: 'boolean', description: '是否禁用二重奏', default: false },
        disableStitch: { type: 'boolean', description: '是否禁用Stitch', default: false },
        videoCoverTimestampMs: { type: 'number', description: '视频封面时间点（毫秒）' },
        hashtags: { type: 'array', items: { type: 'string' }, description: '话题标签列表' },
        pollInterval: { type: 'number', description: '轮询间隔（毫秒）', default: 2000 },
        maxRetries: { type: 'number', description: '最大重试次数', default: 30 },
        file: { type: 'string', format: 'binary', description: '视频文件' }
      },
      required: ['accountId', 'file']
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndPublishVideo(
    @GetToken() systemToken: TokenInfo,
    @Body() uploadDto: CombinedVideoUploadDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    const userId = systemToken.id;
    if (!uploadDto.accountId || !file) {
      throw new BadRequestException('accountId和视频文件是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(uploadDto.accountId);
    return this.tikTokService.uploadAndPublishVideo(
      accessToken,
      userId,
      uploadDto.accountId,
      file.buffer,
      {
        title: uploadDto.title,
        description: uploadDto.description,
        privacyStatus: uploadDto.privacyStatus || 'PUBLIC',
        disableComment: uploadDto.disableComment || false,
        disableDuet: uploadDto.disableDuet || false,
        disableStitch: uploadDto.disableStitch || false,
        videoCoverTimestampMs: uploadDto.videoCoverTimestampMs,
        tags: uploadDto.tags
      },
      uploadDto.pollInterval,
      uploadDto.maxRetries
    );
  }

  /**
 * 获取TikTok账号信息
 */
  @Get('user/profile')
  @ApiOperation({ summary: '获取TikTok账号信息' })
  @ApiQuery({ name: 'accountId', description: 'TikTok账号ID' })
  async getUserProfile(
    @GetToken() systemToken: TokenInfo,
    @Query('accountId') accountId: string
  ) {
    if (!accountId) {
      throw new BadRequestException('accountId是必须的');
    }

    const accessToken = await this.tikTokAuthService.getUserAccessToken(accountId);
    return this.tikTokService.getUserProfile(accessToken, accountId);
  }

}
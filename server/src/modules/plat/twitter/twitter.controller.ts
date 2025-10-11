import { Controller, Get, Post, Body, Query, Res, BadRequestException, Delete, Param, HttpCode, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { GetToken, Public } from 'src/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { TokenInfo } from 'src/auth/interfaces/auth.interfaces';

import { TwitterAuthService } from './twitter.auth.service';
import { TwitterService } from './twitter.service';

@ApiTags('plat/twitter - twitter平台')
@Controller('plat/twitter')
export class TwitterController {
  constructor(
    private readonly twitterAuthService: TwitterAuthService,
    private readonly twitterService: TwitterService,
  ) {}

  /**
   * 获取Twitter授权URL
   */
  @Get('auth/url')
  @ApiOperation({ summary: '获取Twitter授权URL' })
  @ApiQuery({ name: 'mail', required: false, description: '用户邮箱' })
  async getAuthUrl(
    @GetToken() systemToken: TokenInfo,
    @Query('mail') mail: string,
  ) {
    if (!systemToken.id || !mail) {
      throw new BadRequestException('token和mail是必须的');
    }
    return this.twitterAuthService.getAuthorizationUrl(systemToken.id, mail);
  }

  /**
   * 处理Twitter OAuth回调
   */
  @Get('auth/callback')
  @ApiOperation({ summary: 'Twitter授权回调' })
  // @ApiQuery({ name: 'code', required: true, description: '授权码' })
  // @ApiQuery({ name: 'state', required: true, description: '状态值' })
  @Public()
  async handleOAuthCallback(
    // @GetToken() systemToken: TokenInfo,
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
      const results = await this.twitterAuthService.handleAuthorizationCallback(code, state);

      // 获取重定向URL，如果存在的话
      // const redirectUrl = process.env.TWITTER_AUTH_SUCCESS_REDIRECT || 'https://your-frontend-app/auth/success';

      // // 重定向到前端应用，带上必要的参数
      // return res.redirect(`${redirectUrl}?success=true`);
      const render_msg = {
        message: "授权成功！ 这里是添加账号成功后的前端页面，" ,
        datas: results
      };

      return res.render('google/index', render_msg);

    } catch (error) {
      console.error('Twitter授权回调处理失败:', error);

      // 获取失败重定向URL
      const failureRedirectUrl = process.env.TWITTER_AUTH_FAILURE_REDIRECT || 'https://your-frontend-app/auth/failure';

      // 重定向到前端失败页面，带上错误信息
      // return res.redirect(`${failureRedirectUrl}?error=${encodeURIComponent(error.message || 'Unknown error')}`);
      return false
    }
  }

  /**
   * 检查用户是否已授权Twitter
   */
  @Get('auth/check')
  @ApiOperation({ summary: '检查用户Twitter授权状态' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Twitter账号ID' })
  async checkAuthStatus(
    @GetToken() systemToken: TokenInfo,
    @Query('accountId') accountId: string
    ) {
    if (!accountId) {
      throw new BadRequestException('accountId是必须的');
    }

    return await this.twitterAuthService.isAuthorized(accountId);
  }

  /**
   * 撤销Twitter授权
   */
  @Post('auth/revoke')
  @ApiOperation({ summary: '撤销Twitter授权' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Twitter账号ID' }
      }
    }
  })
  async revokeAuth(
    @GetToken() systemToken: TokenInfo,
    @Body('accountId') accountId: string
    ) {
    if (!accountId) {
      throw new BadRequestException('accountId是必须的');
    }

    return await this.twitterAuthService.revokeAuthorization(accountId);
  }

  /**
   * 刷新Twitter访问令牌
   */
  @Post('auth/refresh')
  @ApiOperation({ summary: '刷新Twitter访问令牌' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '用户ID' },
        accountId: { type: 'string', description: 'Twitter账号ID' },
        refreshToken: { type: 'string', description: '刷新令牌' }
      }
    }
  })
  async refreshToken(
    @GetToken() systemToken: TokenInfo,
    @Body('userId') userId: string,
    @Body('accountId') accountId: string,
    @Body('refreshToken') refreshToken: string
  ) {
    if (!userId || !accountId || !refreshToken) {
      throw new BadRequestException('缺少必要的参数');
    }

    return this.twitterAuthService.refreshAccessToken(userId, accountId, refreshToken);
  }

  /**
   * 获取用户的Twitter时间线
   */
  @Get('timeline')
  @ApiOperation({ summary: '获取用户的Twitter时间线' })
  // @ApiQuery({ name: 'userId', required: true, description: '用户ID' })
  @ApiQuery({ name: 'accountId', required: true, description: '账号ID' })
  @ApiQuery({ name: 'maxResults', required: false, description: '最大结果数', type: 'number' })
  async getUserTimeline(
    @GetToken() systemToken: TokenInfo,
    // @Query('userId') userId: string,
    @Query('accountId') accountId: string,
    @Query('maxResults') maxResults?: number,
  ) {

    const userId = systemToken.id;
    if (!userId || !accountId) {
      throw new BadRequestException('userId和accountId是必须的');
    }

    const accessToken = await this.twitterAuthService.getUserAccessToken(accountId);

    return this.twitterService.getUserTimeline(accessToken, userId, accountId, maxResults);
  }

  /**
   * 发布新推文
   */
  @Post('tweets/create')
  @ApiOperation({ summary: '发布新推文' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        // userId: { type: 'string', description: '用户ID' },
        accountId: { type: 'string', description: 'Twitter账号ID' },
        text: { type: 'string', description: '推文内容' },
        mediaIds: { type: 'array', items: { type: 'string' }, description: '媒体ID列表（可选）' }
      },
      required: ['userId', 'accountId', 'text']
    }
  })
  @HttpCode(201)
  async createTweet(
    @GetToken() systemToken: TokenInfo,
    // @Body('userId') userId: string,
    @Body('accountId') accountId: string,
    @Body('text') text: string,
    @Body('mediaIds') mediaIds?: string[],
  ) {
    const userId = systemToken.id;
    if (!userId || !accountId || !text) {
      throw new BadRequestException('userId, accountId和text是必须的');
    }

    const accessToken = await this.twitterAuthService.getUserAccessToken(accountId);
    return this.twitterService.createTweet(accessToken, userId, accountId, text, mediaIds);
  }

  /**
   * 上传媒体文件
   */
  @Post('media/upload')
  @ApiOperation({ summary: '上传媒体文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        accountId: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @GetToken() systemToken: TokenInfo,
    // @Body('userId') userId: string,
    @Body('accountId') accountId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = systemToken.id;
    if (!userId || !accountId || !file) {
      throw new BadRequestException('userId, accountId和file是必须的');
    }

    const accessToken = await this.twitterAuthService.getUserAccessToken(accountId);
    return this.twitterService.uploadMedia(accessToken, userId, accountId, file.buffer, file.mimetype);
  }

  /**
   * 获取推文详情
   */
  @Get('tweets/detail')
  @ApiOperation({ summary: '获取推文详情' })
  @ApiQuery({ name: 'tweetId', type: 'string', description: '推文ID' })
  // @ApiQuery({ name: 'userId', required: true, description: '用户ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Twitter账号ID' })
  async getTweetDetail(
    @GetToken() systemToken: TokenInfo,
    @Query('tweetId') tweetId: string,
    // @Query('userId') userId: string,
    @Query('accountId') accountId: string,
  ) {
    const userId = systemToken.id;
    if (!tweetId || !userId || !accountId) {
      throw new BadRequestException('tweetId, userId和accountId是必须的');
    }

    const accessToken = await this.twitterAuthService.getUserAccessToken(accountId);
    return this.twitterService.getTweetDetail(accessToken, userId, accountId, tweetId);
  }

  /**
   * 获取推文统计数据
   */
  @Get('tweets/metrics')
  @ApiOperation({ summary: '获取推文统计数据' })
  @ApiQuery({ name: 'tweetId', type: 'string', description: '推文ID' })
  // @ApiQuery({ name: 'userId', required: true, description: '用户ID' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Twitter账号ID' })
  async getTweetMetrics(
    @GetToken() systemToken: TokenInfo,
    @Query('tweetId') tweetId: string,
    // @Query('userId') userId: string,
    @Query('accountId') accountId: string,
  ) {
    const userId = systemToken.id;
    if (!tweetId || !userId || !accountId) {
      throw new BadRequestException('tweetId, userId和accountId是必须的');
    }

    const accessToken = await this.twitterAuthService.getUserAccessToken(accountId);
    return this.twitterService.getTweetMetrics(accessToken, userId, accountId, tweetId);
  }

  /**
   * 删除推文
   */
  @Post('tweets/delete')
  @ApiOperation({ summary: '删除推文' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: '账号ID' },
        tweetId: { type: 'string', description: '推文ID' }
      },
      required: ['accountId', 'tweetId']
    }
  })

  async deleteTweet(
    @GetToken() systemToken: TokenInfo,
    @Body('tweetId') tweetId: string,
    @Body('accountId') accountId: string,
  ) {
    const userId = systemToken.id;
    if (!tweetId || !userId || !accountId) {
      throw new BadRequestException('tweetId, userId和accountId是必须的');
    }

    const accessToken = await this.twitterAuthService.getUserAccessToken(accountId);
    return this.twitterService.deleteTweet(accessToken, userId, accountId, tweetId);
  }

  /**
   * 搜索推文
   */
  @Get('tweets/search')
  @ApiOperation({ summary: '搜索推文' })
  @ApiQuery({ name: 'accountId', required: true, description: 'Twitter账号ID' })
  @ApiQuery({ name: 'query', required: true, description: '搜索关键词' })
  @ApiQuery({ name: 'maxResults', required: false, description: '最大结果数', type: 'number' })
  async searchTweets(
    @GetToken() systemToken: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('query') query: string,
    @Query('maxResults') maxResults?: number,
  ) {
    const userId = systemToken.id;
    if (!userId || !accountId || !query) {
      throw new BadRequestException('userId, accountId和query是必须的');
    }

    const accessToken = await this.twitterAuthService.getUserAccessToken(accountId);
    return this.twitterService.searchTweets(accessToken, userId, accountId, query, maxResults);
  }

  /**
   * 对推文点赞、取消点赞
   */
  @Post('tweets/rate')
  @ApiOperation({ summary: '对推文点赞、取消点赞' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: '账号ID' },
        tweetId: { type: 'string', description: '推文ID' },
        rating: { type: 'string', description: '点赞 like、取消点赞  unlike' }
      },
      required: ['accountId', 'tweetId', 'rating']
    }
  })
  async rateTweet(
    @GetToken() systemToken: TokenInfo,
    @Body('tweetId') tweetId: string,
    @Body('accountId') accountId: string,
    @Body('rating') rating: string,
  ) {
    const userId = systemToken.id;
    if (!tweetId || !userId || !accountId || ! rating) {
      throw new BadRequestException('tweetId, rating和accountId是必须的');
    }

    const accessToken = await this.twitterAuthService.getUserAccessToken(accountId);
    // 在方法开始处验证
    if (!["like", "unlike"].includes(rating)) {
        throw new BadRequestException('参数错误: rating必须为like或unlike');
    }

    // 后续处理
    if (rating === "like") {
        return this.twitterService.likeTweet(accessToken, userId, accountId, tweetId);
    } else {
        return this.twitterService.unlikeTweet(accessToken, userId, accountId, tweetId);
    }
  }

}

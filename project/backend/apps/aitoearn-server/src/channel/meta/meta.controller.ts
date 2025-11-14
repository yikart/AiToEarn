import { Body, Controller, Get, Param, Post, Query, Render } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { PlatMetaNatsApi } from '../../transports/channel/api/meta.natsApi'
import {
  CreateAccountAndSetAccessTokenDto,
  FacebookPageSelectionDto,
  GetAuthUrlDto,
} from './dto/meta.dto'

@ApiTags('OpenSource/Platform/Meta')
@Controller('plat/meta')
export class MetaController {
  constructor(
    private readonly platMetaNatsApi: PlatMetaNatsApi,
  ) {}

  @ApiDoc({
    summary: 'Get Meta OAuth URL',
    body: GetAuthUrlDto.schema,
  })
  @Post('auth/url')
  async getAuthUrl(@GetToken() token: TokenInfo, @Body() data: GetAuthUrlDto) {
    const res = await this.platMetaNatsApi.getAuthUrl(token.id, data.platform, data.spaceId || '')
    return res
  }

  @ApiDoc({
    summary: 'Get OAuth Task Status',
  })
  @Get('auth/info/:taskId')
  async getAuthInfo(
    @GetToken() token: TokenInfo,
    @Param('taskId') taskId: string,
  ) {
    const res = await this.platMetaNatsApi.getAuthInfo(taskId)
    return res
  }

  @ApiDoc({
    summary: 'List Facebook Pages',
  })
  @Get('facebook/pages')
  async getFacebookPages(
    @GetToken() token: TokenInfo,
  ) {
    const res = await this.platMetaNatsApi.getFacebookPages(token.id)
    return res
  }

  @ApiDoc({
    summary: 'Select Facebook Pages',
    body: FacebookPageSelectionDto.schema,
  })
  @Post('facebook/pages')
  async selectFacebookPages(
    @GetToken() token: TokenInfo,
    @Body() data: FacebookPageSelectionDto,
  ) {
    const res = await this.platMetaNatsApi.selectFacebookPages(token.id, data.pageIds)
    return res
  }

  @Public()
  @ApiDoc({
    summary: 'Handle Meta OAuth Callback',
    query: CreateAccountAndSetAccessTokenDto.schema,
  })
  @Get('auth/back')
  @Render('auth/meta')
  async createAccountAndSetAccessToken(
    @Query() query: CreateAccountAndSetAccessTokenDto,
  ) {
    return await this.platMetaNatsApi.createAccountAndSetAccessToken(
      query.code,
      query.state,
    )
  }

  // Todo: Only allow internal service access
  @ApiDoc({
    summary: 'List Facebook Page Published Posts',
  })
  @Get('facebook/:accountId/published_posts')
  async getFacebookPagePublishedPosts(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('pageId') pageId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getFacebookPagePublishedPosts(
      accountId,
      query,
    )
  }

  // Todo: Only allow internal service access
  @ApiDoc({
    summary: 'Get Facebook Page Insights',
  })
  @Get('facebook/:accountId/insights')
  async getFacebookPageInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getFacebookPageInsights(accountId, query)
  }

  @ApiDoc({
    summary: 'Get Facebook Post Insights',
  })
  @Get('facebook/:accountId/:postId/insights')
  async getFacebookPostInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('postId') postId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getFacebookPostInsights(accountId, postId, query)
  }

  // Todo: Only allow internal service access
  @ApiDoc({
    summary: 'Get Instagram Account Info',
  })
  @Get('instagram/:accountId')
  async getInstagramAccountInfo(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getInstagramAccountInfo(accountId, query)
  }

  // Todo: Only allow internal service access
  @ApiDoc({
    summary: 'Get Instagram Account Insights',
  })
  @Get('instagram/:accountId/insights')
  async getInstagramAccountInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getInstagramAccountInsights(accountId, query)
  }

  // Todo: Only allow internal service access
  @ApiDoc({
    summary: 'Get Instagram Post Insights',
  })
  @Get('instagram/:accountId/:postId/insights')
  async getInstagramPostInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('postId') postId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getInstagramPostInsights(accountId, postId, query)
  }

  // Todo: Only allow internal service access
  @ApiDoc({
    summary: 'Get Threads Account Insights',
  })
  @Get('threads/:accountId/insights')
  async getThreadsAccountInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getThreadsAccountInsights(accountId, query)
  }

  // Todo: Only allow internal service access
  @ApiDoc({
    summary: 'Get Threads Post Insights',
  })
  @Get('threads/:accountId/:postId/insights')
  async getThreadsPostInsights(
    @GetToken() token: TokenInfo,
    @Param('accountId') accountId: string,
    @Param('postId') postId: string,
    @Query() query: any,
  ) {
    return await this.platMetaNatsApi.getThreadsPostInsights(accountId, postId, query)
  }

  @ApiDoc({
    summary: 'Search Threads Locations',
  })
  @Get('threads/locations')
  async searchThreadsLocation(
    @GetToken() token: TokenInfo,
    @Query('accountId') accountId: string,
    @Query('keyword') keyword: string,
  ) {
    return await this.platMetaNatsApi.searchThreadsLocations(accountId, keyword)
  }
}

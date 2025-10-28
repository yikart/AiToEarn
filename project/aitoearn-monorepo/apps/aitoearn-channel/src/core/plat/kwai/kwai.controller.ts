import { Body, Controller, Post } from '@nestjs/common'
import { AccountIdDto, CreateAccountAndSetAccessTokenDto, GetAuthInfoDto, GetAuthUrlDto, GetPohotListDto } from './dto/kwai.dto'
import { KwaiService } from './kwai.service'

@Controller()
export class KwaiController {
  constructor(private readonly kwaiService: KwaiService) {}

  // 获取页面的认证URL
  // @NatsMessagePattern('plat.kwai.auth')
  @Post('plat/kwai/auth')
  getAuthUrl(@Body() data: GetAuthUrlDto) {
    return this.kwaiService.createAuthTask(data)
  }

  // 查询认证信息
  // @NatsMessagePattern('plat.kwai.getAuthInfo')
  @Post('plat/kwai/getAuthInfo')
  getAuthInfo(@Body() data: GetAuthInfoDto) {
    return this.kwaiService.getAuthInfo(data.taskId)
  }

  // 创建账号并设置授权Token
  // @NatsMessagePattern('plat.kwai.createAccountAndSetAccessToken')
  @Post('plat/kwai/createAccountAndSetAccessToken')
  async createAccountAndSetAccessToken(
    @Body() data: CreateAccountAndSetAccessTokenDto,
  ) {
    const res = await this.kwaiService.createAccountAndSetAccessToken(
      data.taskId,
      {
        code: data.code,
        state: data.state,
      },
    )
    return res
  }

  // 获取用户公开信息
  // @NatsMessagePattern('plat.kwai.getAuthorInfo')
  @Post('plat/kwai/getAuthorInfo')
  getAuthorInfo(@Body() data: AccountIdDto) {
    return this.kwaiService.getAuthorInfo(data.accountId)
  }

  // 获取视频列表
  // @NatsMessagePattern('plat.kwai.getPhotoList')
  @Post('plat/kwai/getPhotoList')
  fetchVideoList(@Body() data: GetPohotListDto) {
    return this.kwaiService.fetchVideoList(data.accountId, data?.cursor, data?.count)
  }

  // @NatsMessagePattern('plat.kwai.accessTokenStatus')
  @Post('plat/kwai/accessTokenStatus')
  async getAccessTokenStatus(@Body() data: AccountIdDto) {
    return await this.kwaiService.getAccessTokenStatus(data.accountId)
  }
}

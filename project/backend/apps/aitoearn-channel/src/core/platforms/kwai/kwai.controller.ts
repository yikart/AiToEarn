import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc } from '@yikart/common'
import { AccountIdDto, CreateAccountAndSetAccessTokenDto, GetAuthInfoDto, GetAuthUrlDto, GetPohotListDto } from './dto/kwai.dto'
import { KwaiService } from './kwai.service'

@ApiTags('OpenSource/Core/Platforms/Kwai')
@Controller()
export class KwaiController {
  constructor(private readonly kwaiService: KwaiService) {}

  @ApiDoc({
    summary: 'Create Authorization Task',
    body: GetAuthUrlDto.schema,
  })
  @Post('plat/kwai/auth')
  getAuthUrl(@Body() data: GetAuthUrlDto) {
    return this.kwaiService.createAuthTask(data)
  }

  @ApiDoc({
    summary: 'Get Authorization Task Info',
    body: GetAuthInfoDto.schema,
  })
  @Post('plat/kwai/getAuthInfo')
  getAuthInfo(@Body() data: GetAuthInfoDto) {
    return this.kwaiService.getAuthInfo(data.taskId)
  }

  @ApiDoc({
    summary: 'Create Account and Set Access Token',
    body: CreateAccountAndSetAccessTokenDto.schema,
  })
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

  @ApiDoc({
    summary: 'Get Author Information',
    body: AccountIdDto.schema,
  })
  @Post('plat/kwai/getAuthorInfo')
  getAuthorInfo(@Body() data: AccountIdDto) {
    return this.kwaiService.getAuthorInfo(data.accountId)
  }

  @ApiDoc({
    summary: 'List Published Videos',
    body: GetPohotListDto.schema,
  })
  @Post('plat/kwai/getPhotoList')
  fetchVideoList(@Body() data: GetPohotListDto) {
    return this.kwaiService.fetchVideoList(data.accountId, data?.cursor, data?.count)
  }

  @ApiDoc({
    summary: 'Get Access Token Status',
    body: AccountIdDto.schema,
  })
  @Post('plat/kwai/accessTokenStatus')
  async getAccessTokenStatus(@Body() data: AccountIdDto) {
    return await this.kwaiService.getAccessTokenStatus(data.accountId)
  }
}

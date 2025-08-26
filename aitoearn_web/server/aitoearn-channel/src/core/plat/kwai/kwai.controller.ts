import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@/common'
import { CreateAccountAndSetAccessTokenDto, GetAuthInfoDto, GetAuthUrlDto } from './dot/kwai.dot'
import { KwaiService } from './kwai.service'

@Controller('kwai')
export class KwaiController {
  constructor(private readonly kwaiService: KwaiService) {}

  // 获取页面的认证URL
  @NatsMessagePattern('plat.kwai.auth')
  getAuthUrl(@Payload() data: GetAuthUrlDto) {
    return this.kwaiService.createAuthTask(data)
  }

  // 查询认证信息
  @NatsMessagePattern('plat.kwai.getAuthInfo')
  getAuthInfo(@Payload() data: GetAuthInfoDto) {
    return this.kwaiService.getAuthInfo(data.taskId)
  }

  // 创建账号并设置授权Token
  @NatsMessagePattern('plat.kwai.createAccountAndSetAccessToken')
  async createAccountAndSetAccessToken(
    @Payload() data: CreateAccountAndSetAccessTokenDto,
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
}

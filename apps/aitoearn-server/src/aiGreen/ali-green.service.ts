import { Injectable, UnauthorizedException } from '@nestjs/common'
import { AliGreenApiService } from '@yikart/ali-green'
import * as _ from 'lodash'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { UserService } from '../user/user.service'
import { ImageBodyDto, TextBodyDto, VideoBodyDto, VideoResultBodyDto } from './dto/ali-green.dto'

@Injectable()
export class AliGreenService {
  constructor(
    private readonly aliGreenApiService: AliGreenApiService,
    private readonly userService: UserService,

  ) {}

  async AuthVip(token: TokenInfo) {
    const { id } = token
    const user = await this.userService.getUserInfoById(id)
    if (_.isEmpty(user) || _.isEmpty(user.vipInfo))
      throw new UnauthorizedException('这是会员限定功能，请开通会员使用')
  }

  async textGreen(data: TextBodyDto, token: TokenInfo) {
    await this.AuthVip(token)
    return this.aliGreenApiService.textGreen(data.content)
  }

  async imgGreen(data: ImageBodyDto, token: TokenInfo) {
    await this.AuthVip(token)
    return this.aliGreenApiService.imgGreen(data.imageUrl)
  }

  async videoGreen(data: VideoBodyDto, token: TokenInfo) {
    await this.AuthVip(token)
    return this.aliGreenApiService.videoGreen(data.url)
  }

  async getVideoResult(data: VideoResultBodyDto, token: TokenInfo) {
    await this.AuthVip(token)
    return this.aliGreenApiService.getVideoResult(data.taskId)
  }
}

import { Controller, Delete, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { ChannelService } from './channel.service'

@ApiTags('OpenSource/Channel/Channel')
@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) { }

  @ApiDoc({
    summary: 'Delete Post',
  })
  @Delete(':accountId/post/:postId')
  async deletePost(
    @Param('accountId') accountId: string,
    @Param('postId') postId: string,
    @GetToken() token: TokenInfo,
  ) {
    return await this.channelService.deletePost(accountId, token.id, postId)
  }
}

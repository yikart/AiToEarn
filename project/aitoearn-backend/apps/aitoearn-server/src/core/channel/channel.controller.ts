import { Body, Controller, Delete, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { ValidateWorkOwnershipDto } from './channel.dto'
import { ChannelService } from './channel.service'
import { ValidateWorkOwnershipVo } from './channel.vo'

@ApiTags('Channel/Channel')
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

  @ApiDoc({
    summary: 'Validate Work Ownership',
    body: ValidateWorkOwnershipDto.schema,
    response: ValidateWorkOwnershipVo,
  })
  @Post('work/validate')
  async validateWorkOwnership(
    @GetToken() token: TokenInfo,
    @Body() body: ValidateWorkOwnershipDto,
  ) {
    return await this.channelService.validateWorkOwnership(token.id, body)
  }
}

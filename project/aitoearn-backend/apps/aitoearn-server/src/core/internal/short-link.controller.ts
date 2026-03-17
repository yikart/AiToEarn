import { Body, Controller, Logger, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { CreateShortLinkDto } from '../short-link/short-link.dto'
import { ShortLinkService } from '../short-link/short-link.service'

@ApiTags('Internal/ShortLink')
@Controller()
export class ShortLinkController {
  private readonly logger = new Logger(ShortLinkController.name)

  constructor(
    private readonly shortLinkService: ShortLinkService,
  ) {}

  @ApiDoc({
    summary: 'Create short link',
    body: CreateShortLinkDto.schema,
  })
  @Internal()
  @Post('/internal/short-link')
  async create(@Body() body: CreateShortLinkDto) {
    const shortLink = await this.shortLinkService.create(body.originalUrl, {
      expiresInSeconds: body.expiresInSeconds,
    })
    return { shortLink }
  }
}

import { Controller, Get, Logger, Param, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { Response } from 'express'
import { ShortLinkService } from './short-link.service'

@ApiTags('ShortLink')
@Controller('shortLink')
export class ShortLinkController {
  private readonly logger = new Logger(ShortLinkController.name)

  constructor(
    private readonly shortLinkService: ShortLinkService,
  ) {}

  @ApiDoc({
    summary: 'Redirect short link to original URL',
  })
  @Public()
  @Get('/:code')
  async redirect(
    @Param('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.logger.log(`Redirecting short link: ${code}`)
    const originalUrl = await this.shortLinkService.getByCode(code)
    res.redirect(originalUrl)
  }
}

import { Body, Controller, Post } from '@nestjs/common'
import {
  ListBrowserProfilesDto,
} from './browser-profile.dto'
import { BrowserProfileService } from './browser-profile.service'
import {
  BrowserProfileListVo,
} from './browser-profile.vo'

@Controller()
export class BrowserProfileController {
  constructor(private readonly browserProfileService: BrowserProfileService) {}

  // @NatsMessagePattern('cloud-space.profile.list')
  @Post('cloud-space/profile/list')
  async listProfiles(@Body() dto: ListBrowserProfilesDto): Promise<BrowserProfileListVo> {
    const [profiles, total] = await this.browserProfileService.listProfiles(dto)
    return new BrowserProfileListVo(profiles, total, dto)
  }
}

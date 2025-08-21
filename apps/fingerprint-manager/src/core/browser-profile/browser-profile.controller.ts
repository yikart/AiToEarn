import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
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

  @MessagePattern('fingerprint.profile.list')
  async listProfiles(@Payload() dto: ListBrowserProfilesDto): Promise<BrowserProfileListVo> {
    const [profiles, total] = await this.browserProfileService.listProfiles(dto)
    return new BrowserProfileListVo(profiles, total, dto)
  }
}

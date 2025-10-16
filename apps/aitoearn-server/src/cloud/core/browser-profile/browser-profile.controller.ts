import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@yikart/common'
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

  @NatsMessagePattern('cloud-space.profile.list')
  async listProfiles(@Payload() dto: ListBrowserProfilesDto): Promise<BrowserProfileListVo> {
    const [profiles, total] = await this.browserProfileService.listProfiles(dto)
    return new BrowserProfileListVo(profiles, total, dto)
  }
}

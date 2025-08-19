import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import {
  CreateBrowserProfileDto,
  ListBrowserProfilesDto,
  ReleaseBrowserProfileDto,
} from './browser-profile.dto'
import { BrowserProfileService } from './browser-profile.service'
import {
  BrowserProfileListVo,
  BrowserProfileVo,
} from './browser-profile.vo'

@Controller()
export class BrowserProfileController {
  constructor(private readonly browserProfileService: BrowserProfileService) {}

  @MessagePattern('fingerprint.profile.create')
  async createProfile(@Payload() dto: CreateBrowserProfileDto): Promise<BrowserProfileVo> {
    const profile = await this.browserProfileService.createProfile(dto)
    return BrowserProfileVo.create(profile)
  }

  @MessagePattern('fingerprint.profile.list')
  async listProfiles(@Payload() dto: ListBrowserProfilesDto): Promise<BrowserProfileListVo> {
    const [profiles, total] = await this.browserProfileService.listProfiles(dto)
    return new BrowserProfileListVo(profiles, total, dto)
  }

  @MessagePattern('fingerprint.profile.release')
  async releaseProfile(@Payload() dto: ReleaseBrowserProfileDto): Promise<void> {
    await this.browserProfileService.releaseProfile(dto.profileId)
  }
}

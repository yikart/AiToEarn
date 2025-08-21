import { AppException, ResponseCode } from '@aitoearn/common'
import { BrowserProfileRepository } from '@aitoearn/mongodb'
import { Injectable } from '@nestjs/common'
import {
  ListBrowserProfilesDto,
} from './browser-profile.dto'

@Injectable()
export class BrowserProfileService {
  constructor(private readonly browserProfileRepository: BrowserProfileRepository) {}

  async listProfiles(dto: ListBrowserProfilesDto) {
    return await this.browserProfileRepository.listWithPagination(dto)
  }

  async getProfileById(profileId: string) {
    const profile = await this.browserProfileRepository.getById(profileId)
    if (!profile) {
      throw new AppException(ResponseCode.BrowserProfileNotFound)
    }
    return profile
  }
}

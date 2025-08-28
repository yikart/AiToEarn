import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { BrowserProfileRepository } from '@yikart/mongodb'
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

import type { Locale } from '@yikart/common'
import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { UserAiInfo, UserRepository, UserType } from '@yikart/mongodb'
import { ReportLocationDto, UpdateUserInfoDto } from './user.dto'

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
  ) { }

  /**
   * Get user information
   * @param id
   * @returns
   */
  async getUserInfoById(id: string) {
    const res = await this.userRepository.getById(id)
    if (!res)
      throw new AppException(ResponseCode.UserNotFound)

    return res
  }

  /**
   * Update user information
   * @param id
   * @param newdData
   * @returns
   */
  async updateUserInfo(
    id: string,
    newdData: UpdateUserInfoDto,
  ): Promise<boolean> {
    const res = await this.userRepository.updateById(id, { $set: newdData })
    return res !== null
  }

  async updateLocation(id: string, data: ReportLocationDto): Promise<boolean> {
    const res = await this.userRepository.updateById(id, { $set: { location: data } })
    return res !== null
  }

  async setAiConfig(userId: string, aiConfig: Partial<UserAiInfo>): Promise<boolean> {
    const res = await this.userRepository.updateAiConfigById(userId, aiConfig)
    return res
  }

  async setAiConfigItem(userId: string, type: 'image' | 'edit' | 'video' | 'agent', value: {
    defaultModel: string
    // eslint-disable-next-line ts/no-explicit-any
    option?: Record<string, any>
  }): Promise<boolean> {
    const res = await this.userRepository.updateAiConfigItemById(userId, type, value)
    return res
  }

  async updateLocale(userId: string, locale: Locale): Promise<boolean> {
    const res = await this.userRepository.updateById(userId, { $set: { locale } })
    return res !== null
  }

  async switchUserType(userId: string, userType: UserType): Promise<boolean> {
    const result = await this.userRepository.updateUserTypeById(userId, userType)
    return result
  }
}

import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { MultiloginAccountRepository } from '@yikart/mongodb'
import {
  CreateMultiloginAccountDto,
  ListMultiloginAccountsDto,
  UpdateMultiloginAccountDto,
} from './multilogin-account.dto'

@Injectable()
export class MultiloginAccountService {
  constructor(
    private readonly multiloginAccountRepository: MultiloginAccountRepository,
  ) {}

  /**
   * 创建Multilogin账号
   */
  async create(createDto: CreateMultiloginAccountDto) {
    return await this.multiloginAccountRepository.create({
      ...createDto,
      currentProfiles: 0,
    })
  }

  /**
   * 分页查询Multilogin账号列表
   */
  async findWithPagination(dto: ListMultiloginAccountsDto) {
    const [accounts, total] = await this.multiloginAccountRepository.listWithPagination(dto)

    return [accounts, total] as const
  }

  /**
   * 分页列出Multilogin账号列表
   */
  async listWithPagination(dto: ListMultiloginAccountsDto) {
    return await this.findWithPagination(dto)
  }

  /**
   * 根据ID查询Multilogin账号
   */
  async findById(id: string) {
    const account = await this.multiloginAccountRepository.getById(id)
    if (!account) {
      throw new AppException(ResponseCode.MultiloginAccountNotFound)
    }
    return account
  }

  /**
   * 根据ID获取Multilogin账号
   */
  async getById(id: string) {
    return await this.findById(id)
  }

  /**
   * 更新Multilogin账号
   */
  async update(updateDto: UpdateMultiloginAccountDto) {
    const { id, ...updateData } = updateDto
    const account = await this.multiloginAccountRepository.updateById(id, updateData)
    if (!account) {
      throw new AppException(ResponseCode.MultiloginAccountNotFound)
    }
    return account
  }

  /**
   * 删除Multilogin账号
   */
  async remove(id: string) {
    const account = await this.multiloginAccountRepository.deleteById(id)
    if (!account) {
      throw new AppException(ResponseCode.MultiloginAccountNotFound)
    }
  }

  /**
   * 增加当前配置数
   */
  async incrementCurrentProfiles(id: string, increment = 1) {
    const account = await this.getById(id)
    const newCurrentProfiles = account.currentProfiles + increment

    if (newCurrentProfiles > account.maxProfiles) {
      throw new AppException(ResponseCode.MultiloginAccountProfilesExceeded)
    }

    return await this.multiloginAccountRepository.updateById(id, {
      currentProfiles: newCurrentProfiles,
    })
  }

  /**
   * 减少当前配置数
   */
  async decrementCurrentProfiles(id: string, decrement = 1) {
    const account = await this.getById(id)
    const newCurrentProfiles = Math.max(0, account.currentProfiles - decrement)

    return await this.multiloginAccountRepository.updateById(id, {
      currentProfiles: newCurrentProfiles,
    })
  }

  /**
   * 获取有可用槽位的账号
   */
  async listAccountsWithAvailableSlots(limit = 10) {
    const [accounts] = await this.multiloginAccountRepository.listWithPagination({
      page: 1,
      pageSize: limit,
      hasAvailableSlots: true,
    })
    return accounts
  }
}

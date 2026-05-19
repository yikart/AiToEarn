import { Injectable } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { AccountStatus } from '@yikart/mongodb'
import { AccountService } from '../account/account.service'
import { RelayAccountException } from '../relay/relay-account.exception'
import { ValidateWorkOwnershipDto } from './channel.dto'
import { ValidateWorkOwnershipVo } from './channel.vo'
import { PlatformService } from './platforms/platforms.service'

@Injectable()
export class ChannelService {
  constructor(
    private readonly platformsService: PlatformService,
    private readonly accountService: AccountService,
  ) { }

  /**
   * 获取用户账号列表
   * @param userId
   */
  async getUserAccounts(userId: string) {
    const res = await this.platformsService.getUserAccounts(userId)
    return res
  }

  async updateChannelAccountStatus(accountId: string, status: AccountStatus) {
    const res = await this.platformsService.updateAccountStatus(accountId, status)
    return res
  }

  async deletePost(accountId: string, userId: string, postId: string) {
    const account = await this.accountService.getAccountById(accountId)
    if (!account || account.userId !== userId) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, accountId)
    }
    const res = await this.platformsService.deletePost(accountId, account.type, postId)
    return res
  }

  async validateWorkOwnership(userId: string, dto: ValidateWorkOwnershipDto): Promise<ValidateWorkOwnershipVo> {
    const account = await this.accountService.getAccountById(dto.accountId)
    if (!account || account.userId !== userId) {
      throw new AppException(ResponseCode.AccountNotFound)
    }
    if (account.relayAccountRef) {
      throw new RelayAccountException(account.relayAccountRef, account.id)
    }

    const authStatus = await this.platformsService.getAccountTokenStatus(
      account.id,
      account.type,
    )
    if (authStatus !== AccountStatus.NORMAL) {
      throw new AppException(ResponseCode.ChannelAuthorizationExpired)
    }

    const workValidation = await this.platformsService.validateOwnedWorkLink(
      account.type,
      account.id,
      dto.workLink,
    )
    if (!workValidation.dataId || !workValidation.uniqueId) {
      throw new AppException(ResponseCode.WorkLinkInfoNotFound)
    }
    const workDetail = workValidation.workDetail

    return ValidateWorkOwnershipVo.create({
      accountId: account.id,
      accountType: account.type,
      authorizationStatus: 'valid',
      ownershipVerified: true,
      dataId: workValidation.dataId,
      uniqueId: workValidation.uniqueId,
      resolvedWorkLink: workValidation.resolvedUrl,
      type: workDetail?.type || workValidation.type,
      videoType: workDetail?.videoType || workValidation.videoType,
      workDetail: workDetail
        ? {
            ...workDetail,
            topics: workDetail.topics || [],
            imgUrlList: workDetail.imgUrlList || [],
          }
        : undefined,
    })
  }
}

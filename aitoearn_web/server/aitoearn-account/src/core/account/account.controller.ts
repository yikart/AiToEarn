import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@/common'
import { AccountService } from './account.service'
import {
  AccountIdDto,
  AccountListDto,
  AddAccountDto,
  DeleteUserAccountDto,
  DeleteUserAccountsDto,
  GetAccountListByIdsDto,
  GetAccountStatisticsDto,
  ListAccountByIdsDto,
  UpdateAccountInfoDto,
  UpdateAccountStatisticsDto,
  UpdateAccountStatusDto,
  UserIdDto,
} from './dto/account.dto'

@Controller()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // 创建账号
  @NatsMessagePattern('account.account.create')
  async createAccount(@Payload() data: AddAccountDto) {
    return await this.accountService.addAccount(data.account, data.data)
  }

  // 获取账号信息
  @NatsMessagePattern('account.account.getAccountInfo')
  getAccountInfoById(@Payload() data: AccountIdDto) {
    return this.accountService.getAccountById(data.accountId)
  }

  // 更新账号信息
  @NatsMessagePattern('account.account.updateAccountInfo')
  updateUserInfo(@Payload() data: UpdateAccountInfoDto) {
    return this.accountService.updateAccountInfo(data.id, data)
  }

  // 更新账号状态
  @NatsMessagePattern('account.account.updateAccountStatus')
  updateAccountStatus(@Payload() data: UpdateAccountStatusDto) {
    return this.accountService.updateAccountStatus(data.id, data.status)
  }

  /**
   * 获取用户所有账户
   * @param data
   * @returns
   */
  @NatsMessagePattern('account.account.getUserAccounts')
  getUserAccounts(@Payload() data: UserIdDto) {
    return this.accountService.getUserAccounts(data.userId)
  }

  /**
   * 获取所有账户
   * @param data
   * @returns
   */
  @NatsMessagePattern('account.account.getAccounts')
  getAccounts(@Payload() data: AccountListDto) {
    return this.accountService.getAccounts(data.filter, data.page)
  }

  /**
   * 获取用户所有账户
   * @param data
   * @returns
   */
  @NatsMessagePattern('account.account.getAccountListByIds')
  getAccountListByIds(@Payload() data: GetAccountListByIdsDto) {
    return this.accountService.getAccountListByIds(data.userId, data.ids)
  }

  /**
   * 获取用户账户总数
   * @param data
   * @returns
   */
  @NatsMessagePattern('account.account.getAccountStatistics')
  getUserAccountCount(@Payload() data: UserIdDto) {
    return this.accountService.getUserAccountCount(data.userId)
  }

  /**
   * 获取用户账户统计信息
   * @param data
   * @returns
   */
  @NatsMessagePattern('account.account.getAccountStatistics')
  getAccountStatistics(@Payload() data: GetAccountStatisticsDto) {
    return this.accountService.getAccountStatistics(data.userId, data.type)
  }

  /**
   * 更新用户账户统计信息
   * @param data
   * @returns
   */
  @NatsMessagePattern('account.account.updateAccountStatistics')
  updateAccountStatistics(@Payload() data: UpdateAccountStatisticsDto) {
    return this.accountService.updateAccountStatistics(data.accountId, data)
  }

  /**
   * 删除账户
   * @param data
   * @returns
   */
  @NatsMessagePattern('account.account.deleteUserAccount')
  deleteUserAccount(@Payload() data: DeleteUserAccountDto) {
    return this.accountService.deleteUserAccount(data.accountId, data.userId)
  }

  /**
   * 删除多个账户
   * @param data
   * @returns
   */
  @NatsMessagePattern('account.account.deleteUserAccounts')
  deleteUserAccounts(@Payload() data: DeleteUserAccountsDto) {
    return this.accountService.deleteUserAccounts(data.ids, data.userId)
  }

  /**
   * 根据查询参数获取账号
   */
  @NatsMessagePattern('account.account.getAccountByParam')
  getAccountByParam(@Payload() data: { [key: string]: string }) {
    return this.accountService.getAccountByParam(data)
  }

  /**
   * 获取用户所有账户
   * @param data
   * @returns
   */
  @NatsMessagePattern('account.account.listByIds')
  listByIds(@Payload() data: ListAccountByIdsDto) {
    return this.accountService.listByIds(data.ids)
  }
}

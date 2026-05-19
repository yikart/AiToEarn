import { Injectable } from '@nestjs/common'
import { getUser, toTextResult, toYamlTextResult } from '@yikart/common'
import { Tool } from '@yikart/nest-mcp'
import * as _ from 'lodash'
import { z } from 'zod'
import { AccountGroupService } from './account-group.service'
import { AccountService } from './account.service'

const getAccountGroupListSchema = z.object({})

const getAccountListByGroupIdSchema = z.object({
  groupId: z.string(),
})

const getAllAccountsSchema = z.object({})

const getAccountDetailSchema = z.object({
  accountId: z.string().describe('Account ID'),
})

@Injectable()
export class AccountMcpController {
  constructor(
    private readonly accountService: AccountService,
    private readonly accountGroupService: AccountGroupService,
  ) {}

  @Tool({
    name: 'getAccountGroupList',
    description: 'Get all account groups for the authenticated user. Returns a list of account groups with their IDs, names, and metadata.',
    parameters: getAccountGroupListSchema,
  })
  async getAccountGroupList(_params: z.infer<typeof getAccountGroupListSchema>) {
    const user = getUser()
    const result = await this.accountGroupService.getAccountGroup(user.id)
    return toYamlTextResult(result.map(group => ({
      ..._.omit(group, ['_id', '__v', 'userId', 'ip', 'proxyIp', 'browserConfig']),
      hasBrowserConfig: Boolean(group.browserConfig),
    })))
  }

  @Tool({
    name: 'getAccountListByGroupId',
    description: 'Get all accounts belonging to a specific account group. Provide groupId. Returns a list of accounts with their IDs, types, names, and status information.',
    parameters: getAccountListByGroupIdSchema,
  })
  async getAccountListByGroupId(params: z.infer<typeof getAccountListByGroupIdSchema>) {
    const user = getUser()
    const result = await this.accountService.getAccountListByUserIdAndGroupId(user.id, params.groupId)
    return toYamlTextResult(result.map(account => _.omit(account, [
      '_id',
      '__v',
      'userId',
      'loginCookie',
      'access_token',
      'refresh_token',
      'token',
    ])))
  }

  @Tool({
    name: 'getAllAccounts',
    description: 'Get all accounts for the authenticated user (ungrouped). Returns platform type, name, ID, group ID, and status for each account.',
    parameters: getAllAccountsSchema,
  })
  async getAllAccounts(_params: z.infer<typeof getAllAccountsSchema>) {
    const user = getUser()
    const result = await this.accountService.getUserAccounts(user.id)
    return toYamlTextResult({
      total: result.length,
      list: result.map(account => _.omit(account, [
        '_id',
        '__v',
        'userId',
        'loginCookie',
        'access_token',
        'refresh_token',
        'token',
      ])),
    })
  }

  @Tool({
    name: 'getAccountDetail',
    description: 'Get detailed information of a single account. Provide account ID to get full details including platform type, UID, name, avatar, status, and group.',
    parameters: getAccountDetailSchema,
  })
  async getAccountDetail(params: z.infer<typeof getAccountDetailSchema>) {
    const user = getUser()
    const account = await this.accountService.getAccountById(params.accountId)
    if (!account || account.userId !== user.id) {
      return toTextResult('Account not found.', true)
    }
    return toYamlTextResult(_.omit(account, [
      '_id',
      '__v',
      'userId',
      'loginCookie',
      'access_token',
      'refresh_token',
      'token',
    ]))
  }
}

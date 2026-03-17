import { Injectable, Logger } from '@nestjs/common'
import { getUser } from '@yikart/common'
import { Tool } from '@yikart/nest-mcp'
import { z } from 'zod'
import { AccountGroupService } from './account-group.service'
import { AccountService } from './account.service'

const getAccountGroupListSchema = z.object({})

const getAccountListByGroupIdSchema = z.object({
  groupId: z.string(),
})

@Injectable()
export class AccountMcpController {
  private readonly logger = new Logger(AccountMcpController.name)

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
    const formatted = result
      .map(group => `ID: ${group.id}, Name: ${group.name}, IP: ${group.proxyIp || 'None'}`)
      .join('\n')
    return {
      content: [
        {
          type: 'text',
          text: `Account Groups:\n${formatted}`,
        },
      ],
    }
  }

  @Tool({
    name: 'getAccountListByGroupId',
    description: 'Get all accounts belonging to a specific account group. Provide groupId. Returns a list of accounts with their IDs, types, names, and status information.',
    parameters: getAccountListByGroupIdSchema,
  })
  async getAccountListByGroupId(params: z.infer<typeof getAccountListByGroupIdSchema>) {
    const user = getUser()
    const { groupId } = params
    const result = await this.accountService.getAccountListByUserIdAndGroupId(user.id, groupId)
    const formatted = result
      .map(account => `[${account.type}] ${account.account || account.uid} (id: ${account.id})`)
      .join('\n')
    return {
      content: [
        {
          type: 'text',
          text: `Accounts:\n${formatted}`,
        },
      ],
    }
  }
}

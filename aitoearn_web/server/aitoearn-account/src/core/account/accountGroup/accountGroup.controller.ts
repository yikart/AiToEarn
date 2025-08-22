import { Controller } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { NatsMessagePattern } from '@/common'
import { AccountGroupService } from './accountGroup.service'
import {
  CreateAccountGroupDto,
  DeleteAccountGroupDto,
  UpdateAccountGroupDto,
  UserIdDto,
} from './dto/accountGroup.dto'

@Controller('accountGroup')
export class AccountGroupController {
  constructor(private readonly accountGroupService: AccountGroupService) {}

  @NatsMessagePattern('account.group.create')
  async createGroup(@Payload() data: CreateAccountGroupDto) {
    return this.accountGroupService.createAccountGroup({
      ...data,
    })
  }

  @NatsMessagePattern('account.group.update')
  async updateGroup(@Payload() data: UpdateAccountGroupDto) {
    return this.accountGroupService.updateAccountGroup(data.id, data)
  }

  // 删除用户组列表
  @NatsMessagePattern('account.group.deleteList')
  async deleteList(@Payload() data: DeleteAccountGroupDto) {
    return this.accountGroupService.deleteAccountGroup(data.ids, data.userId)
  }

  // 获取用户所有账户组
  @NatsMessagePattern('account.group.getList')
  async getAccountGroup(@Payload() data: UserIdDto) {
    return this.accountGroupService.getAccountGroup(data.userId)
  }
}

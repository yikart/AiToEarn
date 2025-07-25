import { NatsMessagePattern } from '@common/decorators'
import { Controller, Logger } from '@nestjs/common'
import { Payload } from '@nestjs/microservices'
import { AdminUserService } from './adminUser.service'
import { UserListDto } from './dto/adminUser.dto'

@Controller()
export class AdminUserController {
  private readonly logger = new Logger(AdminUserController.name)

  constructor(private readonly adminUserService: AdminUserService) {}

  @NatsMessagePattern('user.admin.user.list')
  list(@Payload() data: UserListDto) {
    return this.adminUserService.list(data.page, data.query)
  }
}

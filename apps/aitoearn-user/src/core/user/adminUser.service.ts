import { Injectable, Logger } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { UserRepository, UserStatus } from '@yikart/mongodb'

@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name)

  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async getUserInfoById(id: string, all = false) {
    let userInfo
    try {
      if (all) {
        userInfo = await this.userRepository.getByIdWithPassword(id)
      }
      else {
        userInfo = await this.userRepository.getById(id)
      }
    }
    catch {
      // Logger.error(error);
      return null
    }
    return userInfo
  }

  async list(pageInfo: TableDto, query: {
    keyword?: string
    status?: UserStatus
    time?: string[]
  }) {
    const { pageSize, pageNo } = pageInfo
    const [list, total] = await this.userRepository.listWithPagination({
      page: pageNo || 1,
      pageSize,
      ...query,
      createdAt: query.time,
    })

    return {
      list,
      total,
    }
  }
}

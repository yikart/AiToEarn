import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UpdateUserInfoDto } from 'src/core/user/dto/user.dto'
import { NatsService } from 'src/transports/nats.service'
import { NatsApi } from '../api'
import { User, UserCreatedEvent, UserStatus } from './comment'

@Injectable()
export class UserNatsApi {
  constructor(
    private readonly natsService: NatsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async ping() {
    const res = this.natsService.sendMessage('user.ping', {
      message: 'Ping',
    })

    return res
  }

  /**
   * 获取用户信息
   * @param mail
   * @returns
   */
  async getUserInfoByMail(mail: string, all = false) {
    const res = await this.natsService.sendMessage<User>(
      NatsApi.user.user.getUserInfoByMail,
      {
        mail,
        all,
      },
    )

    return res
  }

  /**
   * 获取用户信息
   * @param id
   * @returns
   */
  async getUserInfoById(id: string, all = false) {
    const res = await this.natsService.sendMessage<User>(
      NatsApi.user.user.getUserInfoById,
      {
        id,
        all,
      },
    )

    return res
  }

  /**
   * 根据推广码获取用户信息
   * @param inviteCode
   * @returns
   */
  async getUserByPopularizeCode(inviteCode: string) {
    const res = await this.natsService.sendMessage<User>(
      NatsApi.user.user.getUserByPopularizeCode,
      {
        inviteCode,
      },
    )

    return res
  }

  /**
   * 邮箱创建用户
   * @param mail
   * @param password
   * @param salt
   * @returns
   */
  async createUserByMail(mail: string, password: string, salt: string, inviteCode?: string) {
    const res = await this.natsService.sendMessage<User>(
      NatsApi.user.user.createUserByMail,
      {
        mail,
        password,
        salt,
        inviteCode,
      },
    )

    this.eventEmitter.emit(
      'user.created',
      new UserCreatedEvent(res),
    )

    return res
  }

  /**
   * 更新用户密码
   * @param id
   * @param password
   * @param salt
   * @returns
   */
  async updateUserPassword(id: string, password: string, salt: string) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.user.user.updateUserPassword,
      {
        id,
        password,
        salt,
      },
    )

    return res
  }

  /**
   * 更新用户信息
   * @param id
   * @param data
   * @returns
   */
  async updateUserInfo(id: string, data: UpdateUserInfoDto) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.user.user.updateUserInfo,
      { id, ...data },
    )

    return res
  }

  /**
   * 更新用户信息
   * @param id
   * @param status
   * @returns
   */
  async updateUserStatus(id: string, status: UserStatus) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.user.user.updateUserStatus,
      { id, status },
    )

    return res
  }

  /**
   * 生成用户推广码
   * @param id
   * @returns
   */
  async generateUsePopularizeCode(id: string) {
    const res = await this.natsService.sendMessage<boolean>(
      NatsApi.user.user.generatePopCode,
      { id },
    )

    return res
  }

  /**
   * 获取用户信息
   * @param clientId
   * @param credential
   * @returns
   */
  async getUserInfoByGoogle(clientId: string, credential: string) {
    const res = await this.natsService.sendMessage<User>(
      NatsApi.user.user.getUserInfoByGoogle,
      {
        clientId,
        credential,
      },
    )

    return res
  }
}

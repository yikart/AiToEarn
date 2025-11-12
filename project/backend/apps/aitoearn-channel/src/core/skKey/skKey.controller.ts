import { Body, Controller, Post } from '@nestjs/common'
import { AppException, ResponseCode } from '@yikart/common'
import { AccountService } from '../account/account.service'
import {
  AddRefAccountDto,
  CreateSkKeyDto,
  GetRefAccountListDto,
  GetSkKeyListDto,
  SkKeyKeyDto,
  UpSkKeyInfoDto,
} from './dto/skKey.dto'
import { SkKeyService } from './skKey.service'

@Controller()
export class SkKeyController {
  constructor(
    private readonly skKeyService: SkKeyService,
    private readonly accountService: AccountService,
  ) {}

  // @NatsMessagePattern('channel.skKey.create')
  @Post('channel/skKey/create')
  async create(@Body() data: CreateSkKeyDto) {
    return await this.skKeyService.create(data)
  }

  // @NatsMessagePattern('channel.skKey.del')
  @Post('channel/skKey/del')
  async del(@Body() data: SkKeyKeyDto) {
    return this.skKeyService.del(data.key)
  }

  // @NatsMessagePattern('channel.skKey.upInfo')
  @Post('channel/skKey/upInfo')
  async upInfo(@Body() data: UpSkKeyInfoDto) {
    return this.skKeyService.upInfo(data.key, data.desc)
  }

  // @NatsMessagePattern('channel.skKey.getInfo')
  @Post('channel/skKey/getInfo')
  async getInfo(@Body() data: SkKeyKeyDto) {
    const skKey = this.skKeyService.getInfo(data.key)
    return skKey
  }

  // @NatsMessagePattern('channel.skKey.list')
  @Post('channel/skKey/list')
  async getList(@Body() data: GetSkKeyListDto) {
    let { list, total } = await this.skKeyService.getList(data.userId, {
      pageNo: data.pageNo,
      pageSize: data.pageSize,
    })

    list = await Promise.all(
      list.map(async (item: any) => {
        const extendedItem = item.toObject()
        extendedItem.accountNum = await this.skKeyService.getRefAccountCount(
          item.key,
        )
        extendedItem.active = await this.skKeyService.checkActive(item.key)
        return extendedItem // 确保返回新对象
      }),
    )

    return { list, total }
  }

  // @NatsMessagePattern('channel.skKey.addRefAccount')
  @Post('channel/skKey/addRefAccount')
  async addRefAccount(@Body() data: AddRefAccountDto) {
    const account = await this.accountService.getAccountInfo(data.accountId)
    if (!account)
      throw new AppException(ResponseCode.SkKeyAccountNotFound)
    return this.skKeyService.addRefAccount(data.key, account)
  }

  // @NatsMessagePattern('channel.skKey.delRefAccount')
  @Post('channel/skKey/delRefAccount')
  async delRefAccount(@Body() data: AddRefAccountDto) {
    return this.skKeyService.delRefAccount(data.key, data.accountId)
  }

  // @NatsMessagePattern('channel.skKey.getRefAccountList')
  @Post('channel/skKey/getRefAccountList')
  async getRefAccountList(@Body() data: GetRefAccountListDto) {
    return this.skKeyService.getRefAccountList(data.key, {
      pageNo: data.pageNo,
      pageSize: data.pageSize,
    })
  }
}

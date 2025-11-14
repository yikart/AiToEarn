import { Body, Controller, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ApiDoc, AppException, ResponseCode } from '@yikart/common'
import { AccountService } from '../account/account.service'
import {
  AddRefAccountDto,
  CreateSkKeyDto,
  GetRefAccountListDto,
  GetSkKeyListDto,
  SkKeyKeyDto,
  UpSkKeyInfoDto,
} from './dto/sk-key.dto'
import { SkKeyService } from './sk-key.service'

@ApiTags('OpenSource/Core/SkKey/SkKey')
@Controller()
export class SkKeyController {
  constructor(
    private readonly skKeyService: SkKeyService,
    private readonly accountService: AccountService,
  ) {}

  // @NatsMessagePattern('channel.skKey.create')
  @ApiDoc({
    summary: 'Create SkKey',
    body: CreateSkKeyDto.schema,
  })
  @Post('channel/skKey/create')
  async create(@Body() data: CreateSkKeyDto) {
    return await this.skKeyService.create(data)
  }

  // @NatsMessagePattern('channel.skKey.del')
  @ApiDoc({
    summary: 'Delete SkKey',
    body: SkKeyKeyDto.schema,
  })
  @Post('channel/skKey/del')
  async del(@Body() data: SkKeyKeyDto) {
    return this.skKeyService.del(data.key)
  }

  // @NatsMessagePattern('channel.skKey.upInfo')
  @ApiDoc({
    summary: 'Update SkKey Info',
    body: UpSkKeyInfoDto.schema,
  })
  @Post('channel/skKey/upInfo')
  async upInfo(@Body() data: UpSkKeyInfoDto) {
    return this.skKeyService.upInfo(data.key, data.desc)
  }

  // @NatsMessagePattern('channel.skKey.getInfo')
  @ApiDoc({
    summary: 'Get SkKey Detail',
    body: SkKeyKeyDto.schema,
  })
  @Post('channel/skKey/getInfo')
  async getInfo(@Body() data: SkKeyKeyDto) {
    const skKey = this.skKeyService.getInfo(data.key)
    return skKey
  }

  // @NatsMessagePattern('channel.skKey.list')
  @ApiDoc({
    summary: 'List SkKeys',
    body: GetSkKeyListDto.schema,
  })
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
  @ApiDoc({
    summary: 'Add SkKey Reference Account',
    body: AddRefAccountDto.schema,
  })
  @Post('channel/skKey/addRefAccount')
  async addRefAccount(@Body() data: AddRefAccountDto) {
    const account = await this.accountService.getAccountInfo(data.accountId)
    if (!account)
      throw new AppException(ResponseCode.SkKeyAccountNotFound)
    return this.skKeyService.addRefAccount(data.key, account)
  }

  // @NatsMessagePattern('channel.skKey.delRefAccount')
  @ApiDoc({
    summary: 'Remove SkKey Reference Account',
    body: AddRefAccountDto.schema,
  })
  @Post('channel/skKey/delRefAccount')
  async delRefAccount(@Body() data: AddRefAccountDto) {
    return this.skKeyService.delRefAccount(data.key, data.accountId)
  }

  // @NatsMessagePattern('channel.skKey.getRefAccountList')
  @ApiDoc({
    summary: 'List SkKey Reference Accounts',
    body: GetRefAccountListDto.schema,
  })
  @Post('channel/skKey/getRefAccountList')
  async getRefAccountList(@Body() data: GetRefAccountListDto) {
    return this.skKeyService.getRefAccountList(data.key, {
      pageNo: data.pageNo,
      pageSize: data.pageSize,
    })
  }
}

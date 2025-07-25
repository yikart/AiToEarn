import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { AppException, NatsMessagePattern } from '@/common';
import { AccountService } from '../account/account.service';
import {
  AddRefAccountDto,
  CreateSkKeyDto,
  GetRefAccountListDto,
  GetSkKeyListDto,
  SkKeyKeyDto,
  UpSkKeyInfoDto,
} from './dto/skKey.dto';
import { SkKeyService } from './skKey.service';

@Controller('skKey')
export class SkKeyController {
  constructor(
    private readonly skKeyService: SkKeyService,
    private readonly accountService: AccountService,
  ) {}

  @NatsMessagePattern('channel.skKey.create')
  async create(@Payload() data: CreateSkKeyDto) {
    return this.skKeyService.create(data);
  }

  @NatsMessagePattern('channel.skKey.del')
  async del(@Payload() data: SkKeyKeyDto) {
    return this.skKeyService.del(data.key);
  }

  @NatsMessagePattern('channel.skKey.upInfo')
  async upInfo(@Payload() data: UpSkKeyInfoDto) {
    return this.skKeyService.upInfo(data.key, data.desc);
  }

  @NatsMessagePattern('channel.skKey.getInfo')
  async getInfo(@Payload() data: SkKeyKeyDto) {
    const skKey = this.skKeyService.getInfo(data.key);
    return skKey;
  }

  @NatsMessagePattern('channel.skKey.list')
  async getList(@Payload() data: GetSkKeyListDto) {
    let { list, total } = await this.skKeyService.getList(data.userId, {
      pageNo: data.pageNo,
      pageSize: data.pageSize,
    });

    list = await Promise.all(
      list.map(async (item: any) => {
        const extendedItem = item.toObject();
        extendedItem.accountNum = await this.skKeyService.getRefAccountCount(
          item.key,
        );
        extendedItem.active = await this.skKeyService.checkActive(item.key);
        return extendedItem; // 确保返回新对象
      }),
    );

    return { list, total };
  }

  @NatsMessagePattern('channel.skKey.addRefAccount')
  async addRefAccount(@Payload() data: AddRefAccountDto) {
    const account = await this.accountService.getAccountInfo(data.accountId);
    if (!account)
      throw new AppException(1, '账户不存在');
    return this.skKeyService.addRefAccount(data.key, account);
  }

  @NatsMessagePattern('channel.skKey.delRefAccount')
  async delRefAccount(@Payload() data: AddRefAccountDto) {
    return this.skKeyService.delRefAccount(data.key, data.accountId);
  }

  @NatsMessagePattern('channel.skKey.getRefAccountList')
  async getRefAccountList(@Payload() data: GetRefAccountListDto) {
    return this.skKeyService.getRefAccountList(data.key, {
      pageNo: data.pageNo,
      pageSize: data.pageSize,
    });
  }
}

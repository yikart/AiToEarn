import { Controller, Get, Logger } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { NatsMessagePattern } from '@/common';
import { BilibiliService } from './bilibili.service';
import {
  AccountIdDto,
  ArchiveListDto,
  CreateAccountAndSetAccessTokenDto,
  GetArcStatDto,
  GetAuthInfoDto,
  GetAuthUrlDto,
  GetHeaderDto,
} from './dto/bilibili.dto';

@Controller('bilibili')
export class BilibiliController {
  constructor(private readonly bilibiliService: BilibiliService) {}

  @Get('config')
  async getBilibiliConfig(
  ) {
    return this.bilibiliService.getBilibiliConfig();
  }

  // 创建授权任务
  @NatsMessagePattern('plat.bilibili.auth')
  createAuthTask(@Payload() data: GetAuthUrlDto) {
    const res = this.bilibiliService.createAuthTask({
      userId: data.userId,
      type: data.type,
    });
    return res;
  }

  // 查询认证信息
  @NatsMessagePattern('plat.bilibili.getAuthInfo')
  getAuthInfo(@Payload() data: GetAuthInfoDto) {
    const res = this.bilibiliService.getAuthInfo(data.taskId);
    return res;
  }

  // 查询账号的认证信息
  @NatsMessagePattern('plat.bilibili.getAccountAuthInfo')
  getAccountAuthInfo(@Payload() data: AccountIdDto) {
    const res = this.bilibiliService.getAccountAuthInfo(data.accountId);
    return res;
  }

  // 获取鉴权头
  @NatsMessagePattern('plat.bilibili.getHeader')
  async getHeader(@Payload() data: GetHeaderDto) {
    const res = this.bilibiliService.generateHeader(data.accountId, {
      body: data.body,
      isForm: data.isForm,
    });
    return res;
  }

  // 创建账号并设置授权Token
  @NatsMessagePattern('plat.bilibili.createAccountAndSetAccessToken')
  async createAccountAndSetAccessToken(
    @Payload() data: CreateAccountAndSetAccessTokenDto,
  ) {
    const res = await this.bilibiliService.createAccountAndSetAccessToken(
      data.taskId,
      {
        code: data.code,
        state: data.state,
      },
    );
    return res;
  }

  // 查询账号已授权权限列表
  @NatsMessagePattern('bilibili.account.scopes')
  async getAccountScopes(@Payload() data: AccountIdDto) {
    const res = await this.bilibiliService.getAccountScopes(data.accountId);
    return res;
  }

  // 获取分区列表
  @NatsMessagePattern('plat.bilibili.archiveTypeList')
  async archiveTypeList(@Payload() data: AccountIdDto) {
    return await this.bilibiliService.archiveTypeList(data.accountId);
  }

  @NatsMessagePattern('plat.bilibili.archiveList')
  async getArchiveList(@Payload() data: ArchiveListDto) {
    return await this.bilibiliService.getArchiveList(data.accountId, {
      ps: data.page.pageSize,
      pn: data.page.pageNo!,
      status: data.filter.status,
    });
  }

  @NatsMessagePattern('plat.bilibili.userStat')
  async getUserStat(@Payload() data: AccountIdDto) {
    return await this.bilibiliService.getUserStat(data.accountId);
  }

  @NatsMessagePattern('plat.bilibili.arcStat')
  async getArcStat(@Payload() data: GetArcStatDto) {
    return await this.bilibiliService.getArcStat(
      data.accountId,
      data.resourceId,
    );
  }

  @NatsMessagePattern('plat.bilibili.arcIncStat')
  async getArcIncStat(@Payload() data: AccountIdDto) {
    return await this.bilibiliService.getArcIncStat(data.accountId);
  }
}

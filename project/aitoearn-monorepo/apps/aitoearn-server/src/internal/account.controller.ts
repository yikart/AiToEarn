import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { AccountService } from '../account/account.service'
import { AccountIdDto, AccountListByIdsDto, AccountListByParamDto, AccountListByTypesDto, CreateAccountDto, UpdateAccountDto, UpdateAccountStatisticsDto, UpdateAccountStatusDto } from '../account/dto/account.dto'
import { AccountInternalService } from './provider/account.service'

@ApiTags('内部服务接口')
@Controller('internal')
@Internal()
export class AccountController {
  private readonly logger = new Logger(AccountController.name)
  constructor(
    private readonly accountInternalService: AccountInternalService,
    private readonly accountService: AccountService,
  ) { }

  @ApiOperation({ summary: 'create social media accounts' })
  @Post('/:userId/socials/accounts')
  async createOrUpdateAccount(
    @Param('userId') userId: string,
    @Body() body: CreateAccountDto,
  ) {
    this.logger.log(
      `Creating social media account for userId: ${userId} with body: ${JSON.stringify(body)}`,
    )
    return await this.accountInternalService.createSocialMediaAccount(
      userId,
      body,
    )
  }

  @ApiOperation({ summary: 'get social media account detail' })
  @Get('/:userId/socials/accounts/:accountId')
  async getAccountDetail(
    @Param('userId') userId: string,
    @Param('accountId') accountId: string,
  ) {
    return await this.accountInternalService.getAccountDetail(
      userId,
      accountId,
    )
  }

  @ApiOperation({ summary: 'update social media account' })
  @Patch('/:userId/socials/accounts/:accountId')
  async updateAccountInfo(
    @Param('userId') userId: string,
    @Param('accountId') accountId: string,
    @Body() body: UpdateAccountDto,
  ) {
    const res = await this.accountInternalService.updateAccountInfo(
      userId,
      body,
    )
    return res
  }

  @ApiOperation({ summary: 'update account insights' })
  @Patch('/socials/accounts/:accountId/statistics')
  async updateAccountStatistics(
    @Param('accountId') accountId: string,
    @Body() body: UpdateAccountStatisticsDto,
  ) {
    return this.accountInternalService.updateAccountStatistics(
      accountId,
      body,
    )
  }

  @ApiOperation({ summary: 'get channel info' })
  @Post('account/info')
  async getAccountInfoToTask(@Body() body: AccountIdDto) {
    return this.accountService.getAccountById(body.id)
  }

  @ApiOperation({ summary: 'get channel list（by ids）' })
  @Post('account/list/ids')
  async getAccountListByIds(
    @Body() body: AccountListByIdsDto,
  ) {
    return this.accountService.getAccountListByIds(body.ids)
  }

  @ApiOperation({ summary: 'get channel list（by types)' })
  @Post('account/list/types')
  async getAccountListByTypes(
    @Body() body: AccountListByTypesDto,
  ) {
    return this.accountService.getAccountsByTypes(body.types, body.status)
  }

  @ApiOperation({ summary: 'get channel list（by param)' })
  @Post('account/list/param')
  async getAccountListByParam(
    @Body() body: AccountListByParamDto,
  ) {
    return this.accountService.getAccountByParam(body)
  }

  @ApiOperation({ summary: 'update account status' })
  @Post('account/update/status')
  async updateAccountStatus(
    @Body() body: UpdateAccountStatusDto,
  ) {
    return this.accountService.updateAccountStatus(body.id, body.status)
  }
}

import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Internal } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { AccountService } from '../account/account.service'
import { AccountGroupService } from '../account/accountGroup.service'
import { AccountIdDto, AccountListByIdsDto, AccountListByParamDto, AccountListByTypesDto, CreateAccountDto, UpdateAccountDto, UpdateAccountStatisticsDto, UpdateAccountStatusDto } from '../account/dto/account.dto'
import { AccountInternalService } from './provider/account.service'

@ApiTags('OpenSource/Internal/Account')
@Controller('internal')
@Internal()
export class AccountController {
  private readonly logger = new Logger(AccountController.name)
  constructor(
    private readonly accountInternalService: AccountInternalService,
    private readonly accountService: AccountService,
    private readonly accountGroupService: AccountGroupService,
  ) { }

  @Get('socials/account/:accountId')
  async getAccountInfo(
    @Param('accountId') accountId: string,
  ) {
    return await this.accountInternalService.getAccountInfo(
      accountId,
    )
  }

  @ApiDoc({
    summary: 'Create Social Media Account',
    body: CreateAccountDto.schema,
  })
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

  @ApiDoc({
    summary: 'Get Social Media Account Detail',
  })
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

  @ApiDoc({
    summary: 'Update Social Media Account',
    body: UpdateAccountDto.schema,
  })
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

  @ApiDoc({
    summary: 'Update Account Insights',
  })
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

  @ApiDoc({
    summary: 'Get Account Info for Task',
    body: AccountIdDto.schema,
  })
  @Post('account/info')
  async getAccountInfoToTask(@Body() body: AccountIdDto) {
    return this.accountService.getAccountById(body.id)
  }

  @ApiDoc({
    summary: 'Get Account List by IDs',
    body: AccountListByIdsDto.schema,
  })
  @Post('account/list/ids')
  async getAccountListByIds(
    @Body() body: AccountListByIdsDto,
  ) {
    return this.accountService.getAccountListByIds(body.ids)
  }

  @ApiDoc({
    summary: 'Get Account List by Types',
  })
  @Post('account/list/types')
  async getAccountListByTypes(
    @Body() body: AccountListByTypesDto,
  ) {
    return this.accountService.getAccountsByTypes(body.types, body.status)
  }

  @ApiDoc({
    summary: 'Get Account List by Parameters',
    body: AccountListByParamDto.schema,
  })
  @Post('account/list/param')
  async getAccountListByParam(
    @Body() body: AccountListByParamDto,
  ) {
    return this.accountService.getAccountByParam(body)
  }

  @ApiDoc({
    summary: 'Update Account Status',
    body: UpdateAccountStatusDto.schema,
  })
  @Post('account/update/status')
  async updateAccountStatus(
    @Body() body: UpdateAccountStatusDto,
  ) {
    return this.accountService.updateAccountStatus(body.id, body.status)
  }

  @ApiDoc({
    summary: 'Get Account Group Info',
  })
  @Get('accountGroup/info/:id')
  async getAccountGroupInfo(
    @Param('id') id: string,
  ) {
    return this.accountGroupService.findOneById(id)
  }
}

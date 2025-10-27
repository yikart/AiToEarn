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
import { CreateAccountDto, UpdateAccountDto, UpdateAccountStatisticsDto } from '../account/dto/account.dto'
import { AccountInternalService } from './provider/account.service'

@ApiTags('内部服务接口')
@Controller('internal')
export class AccountController {
  private readonly logger = new Logger(AccountController.name)
  constructor(private readonly accountInternalService: AccountInternalService) { }

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
    @Body() body: UpdateAccountDto,
  ) {
    const res = await this.accountInternalService.updateAccountInfo(
      userId,
      body,
    )
    return res
  }

  @ApiOperation({ summary: 'update account insights' })
  @Patch('/:userId/socials/accounts/:accountId/statistics')
  async updateAccountStatistics(
    @Param('userId') userId: string,
    @Body() body: UpdateAccountStatisticsDto,
  ) {
    return this.accountInternalService.updateAccountStatistics(
      userId,
      body,
    )
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { CreateAccountDto, UpdateAccountDto, UpdateAccountStatisticsDto } from '../account/dto/account.dto'
import { InternalService } from './internal.service'

@ApiTags('内部服务接口')
@Controller('internal')
export class InternalController {
  constructor(private readonly internalService: InternalService) { }

  @ApiOperation({ summary: 'create social media accounts' })
  @Post('/:userId/socials/accounts')
  async createOrUpdateAccount(
    @Param('userId') userId: string,
    @Body() body: CreateAccountDto,
  ) {
    return await this.internalService.createSocialMediaAccount(
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
    return await this.internalService.getAccountDetail(
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
    const res = await this.internalService.updateAccountInfo(
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
    return this.internalService.updateAccountStatistics(
      userId,
      body,
    )
  }
}

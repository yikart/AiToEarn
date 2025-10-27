import { Body, Controller, Delete, Get, Logger, Param, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { TableDto } from '@yikart/common'
import { CreateUserWalletAccountDto, UpdateUserWalletAccountDto } from './dto/userWalletAccount.dto'
import { UserWalletAccountService } from './userWalletAccount.service'

@ApiTags('用户钱包账户')
@Controller('userWalletAccount')
export class UserWalletAccountController {
  private readonly logger = new Logger(UserWalletAccountController.name)

  constructor(private readonly userWalletAccountService: UserWalletAccountService) {}

  @ApiOperation({
    description: '创建钱包账户',
    summary: '创建钱包账户',
  })
  @Post()
  async create(
    @GetToken() tokenInfo: TokenInfo,
    @Body() body: CreateUserWalletAccountDto,
  ) {
    return await this.userWalletAccountService.create(tokenInfo.id, body)
  }

  @ApiOperation({
    description: '删除钱包账户',
    summary: '删除钱包账户',
  })
  @Delete(':id')
  async delete(
    @Param('id') id: string,
  ) {
    const res = await this.userWalletAccountService.delete(id)
    return res
  }

  @ApiOperation({
    description: '更新钱包账户',
    summary: '更新钱包账户',
  })
  @Put('')
  async update(
    @Body() body: UpdateUserWalletAccountDto,
  ) {
    const res = await this.userWalletAccountService.update(body)
    return res
  }

  @ApiOperation({
    description: '获取钱包账户信息',
    summary: '获取钱包账户信息',
  })
  @Get('info/:id')
  async info(
    @Param('id') id: string,
  ) {
    const res = await this.userWalletAccountService.info(id)
    return res
  }

  @ApiOperation({
    description: '获取钱包账户列表',
    summary: '获取钱包账户列表',
  })
  @Get('list/:pageNo/:pageSize')
  list(
    @GetToken() tokenInfo: TokenInfo,
    @Param() params: TableDto,
  ) {
    return this.userWalletAccountService.list(params, {
      userId: tokenInfo.id,
    })
  }
}

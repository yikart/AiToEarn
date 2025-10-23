import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AppException } from '@yikart/common'
import { OrgGuard, validatePassWord } from '../../common'
import { Public } from '../../common/auth/auth.guard'
import { AuthService } from '../../common/auth/auth.service'
import { AccountLoginDto } from './dto/login.dto'
import { ManagerService } from './manager.service'

@ApiTags('管理员登录-login')
@Controller('login')
export class LoginController {
  constructor(
    private readonly authService: AuthService,
    private readonly managerService: ManagerService,
  ) {
  }

  @ApiOperation({
    summary: '登陆',
    description: '邮箱',
  })
  @Public()
  @Post()
  async login(@Body() loginInfo: AccountLoginDto) {
    const { account, password } = loginInfo

    const manager = await this.managerService.getInfoByAccount(account)
    if (!manager)
      throw new AppException(1, '账号不存在')

    // 校验密码
    const isOk = validatePassWord(
      manager.password || '',
      manager.salt || '',
      password,
    )
    if (!isOk)
      throw new AppException(1, '密码错误')

    const token = this.authService.generateToken({
      id: manager.id,
      account: manager.account,
    })

    return {
      token,
      managerInfo: manager,
    }
  }

  @ApiOperation({
    summary: '创建初始账户',
    description: '创建初始账户',
  })
  @Public()
  @UseGuards(OrgGuard)
  @Get('_init')
  async _init() {
    const res = await this.managerService.initAdmin()
    return res
  }
}

import { Body, Controller, Delete, Get, Logger, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AppException, ResponseCode } from '@yikart/common'
import { MailService } from '@yikart/mail'
import { UserStatus } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'
import { GetToken, Public } from '../auth/auth.guard'
import { AuthService } from '../auth/auth.service'
import { TokenInfo } from '../auth/interfaces/auth.interfaces'
import { getRandomString } from '../common/utils'
import { encryptPassword, validatePassWord } from '../common/utils/password.util'
import { config } from '../config'
import {
  GoogleLoginDto,
  MailLoginDto,
  MailRepasswordDto,
  RegistByMailDto,
  UserCancelDto,
} from './dto/login.dto'
import { UserService } from './user.service'

interface UserMailRegistCache {
  code: string
  status: 0 | 1
}

@ApiTags('用户登录-login')
@Controller('login')
export class LoginController {
  private readonly logger = new Logger(LoginController.name)
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) { }

  @ApiOperation({
    summary: '邮箱登陆/注册',
    description: '邮箱登陆/注册',
  })
  @Public()
  @Post('mail')
  async loginByMail(@Body() loginInfo: MailLoginDto) {
    const { mail, password } = loginInfo

    const userInfo = await this.userService.getUserInfoByMail(mail, true)
    if (!!userInfo && !userInfo.isDelete) {
      if (userInfo.status === UserStatus.STOP)
        throw new AppException(ResponseCode.UserStatusError, 'The account has been disabled')

      // 校验密码
      const isOk = validatePassWord(
        userInfo.password || '',
        userInfo.salt || '',
        password,
      )

      if (!isOk)
        throw new AppException(ResponseCode.UserPasswordError, 'password is error')
      const token = this.authService.generateToken(userInfo)
      const TokenInfo = this.authService.decodeToken(token)

      this.userService.afterLogin(userInfo)

      return {
        type: 'login',
        token,
        exp: TokenInfo.exp,
        userInfo,
      }
    }

    // 没有进行创建逻辑
    const code = getRandomString(6, true)
    const mailRes = await this.mailService.sendEmail({
      to: mail,
      subject: 'aitoearn regist',
      template: 'mail/regist',
      context: {
        code,
        mail,
      },
    })

    if (!mailRes)
      throw new AppException(ResponseCode.MailSendFail, 'Mail sending failed')

    await this.redisService.setJson(
      `userMailRegist:${mail}`,
      {
        code,
        status: 0,
      },
      60 * 10,
    )

    return {
      type: 'regist',
      code: config.environment === 'production' ? '' : code,
    }
  }

  @ApiOperation({
    summary: '邮箱注册',
    description: '邮箱注册',
  })
  @Public()
  @Post('mail/regist')
  async registByMail(@Body() body: RegistByMailDto) {
    const { mail, code, inviteCode, password } = body
    const rData = await this.redisService.getJson<UserMailRegistCache>(
      `userMailRegist:${mail}`,
    )
    if (!rData)
      throw new AppException(ResponseCode.UserLoginCodeError, 'The verification code does not exist')

    if (rData.code !== code)
      throw new AppException(ResponseCode.UserLoginCodeError, 'The verification code is incorrect')

    if (inviteCode) {
      const inviteUserInfo
        = await this.userService.getUserByPopularizeCode(inviteCode)
      if (!inviteUserInfo)
        throw new AppException(ResponseCode.UserLoginCodeError, 'The invitation code is incorrect')
    }

    // 生成加盐密码
    const { password: resPassword, salt: resSalt } = encryptPassword(password)

    // 创建新用户
    const userInfo = await this.userService.createUserByMail(
      mail,
      resPassword,
      resSalt,
      inviteCode,
    )

    const token = this.authService.generateToken(userInfo)
    const TokenInfo = this.authService.decodeToken(token)

    return {
      token,
      exp: TokenInfo.exp,
      userInfo,
    }
  }

  @ApiOperation({
    summary: '邮箱重置密码',
    description: '邮箱重置密码',
  })
  @Public()
  @Post('repassword/mail')
  async repasswordByMail(@Body() body: MailRepasswordDto) {
    const { mail } = body

    const userInfo = await this.userService.getUserInfoByMail(mail)

    if (!userInfo || userInfo.isDelete)
      throw new AppException(ResponseCode.UserStatusError, 'The account does not exist')

    // 没有进行创建逻辑
    const code = getRandomString(6, true)
    const rRes = await this.redisService.setJson(
      `userMailRepassword:${mail}`,
      { code, status: 0 },
      60 * 5,
    )
    if (!rRes)
      throw new AppException(ResponseCode.MailSendFail, 'Mail code add failed')

    // 发验证码邮件,邮箱号和code
    const mailRes = await this.mailService.sendEmail({
      to: mail,
      subject: 'aitoearn repassword',
      template: 'mail/repassword',
      context: {
        code,
        mail,
      },
    })
    if (!mailRes)
      throw new AppException(ResponseCode.MailSendFail, 'Mail sending failed')

    return config.environment === 'production' ? '' : code
  }

  @ApiOperation({
    summary: '邮箱重设密码',
    description: '邮箱重设密码',
  })
  @Public()
  @Put('repassword/mail')
  async getRepasswordByMailBack(@Body() body: RegistByMailDto) {
    const { mail, code, password } = body

    const rRes = await this.redisService.getJson<UserMailRegistCache>(
      `userMailRepassword:${mail}`,
    )
    if (!rRes || rRes.code !== code)
      throw new AppException(ResponseCode.ValidationFailed, 'The verification code is incorrect')

    const userInfo = await this.userService.getUserInfoByMail(mail)
    if (!userInfo || userInfo.isDelete)
      throw new AppException(ResponseCode.UserStatusError, 'The account does not exist')

    const { password: resPassword, salt: resSalt } = encryptPassword(password)

    const res = await this.userService.updateUserPassword(
      userInfo.id,
      resPassword,
      resSalt,
    )

    if (!res)
      throw new AppException(ResponseCode.ValidationFailed, 'Password update failed')

    const token = this.authService.generateToken(userInfo)
    const TokenInfo = this.authService.decodeToken(token)

    return {
      token,
      exp: TokenInfo.exp,
      userInfo,
    }
  }

  @ApiOperation({
    summary: 'google登录',
    description: 'google登录',
  })
  @Public()
  @Post('google')
  async loginByGoogle(@Body() loginInfo: GoogleLoginDto) {
    const { clientId, credential } = loginInfo
    const userInfo = await this.userService.getUserInfoByGoogle(
      clientId,
      credential,
    )
    if (!userInfo)
      throw new AppException(ResponseCode.UserNotFound, 'The User does not exist')

    if (userInfo.status === UserStatus.STOP)
      throw new AppException(ResponseCode.UserStatusError, 'The User is disabled')
    const tokenInfo = {
      id: userInfo.id,
      mail: userInfo.mail,
      name: userInfo.name,
    }
    const token = this.authService.generateToken(tokenInfo)
    const TokenInfo = this.authService.decodeToken(token)

    this.userService.afterLogin(userInfo)

    return {
      type: 'login',
      token,
      exp: TokenInfo.exp,
      userInfo,
    }
  }

  @ApiOperation({
    summary: '获取注销验证码',
    description: '获取注销验证码',
  })
  @Get('cancel/code')
  async getCancelMailCode(@GetToken() token: TokenInfo) {
    const userInfo = await this.userService.getUserInfoById(token.id)
    if (!userInfo || !userInfo.isDelete)
      throw new AppException(ResponseCode.UserStatusError)

    const code = getRandomString(6, true)

    // 发验证码邮件,邮箱号和code
    const mailRes = await this.mailService.sendEmail({
      to: userInfo.mail,
      subject: 'aitoearn cancel',
      template: 'mail/cancel',
      context: {
        code,
      },
    })

    void this.redisService.set(
      `userCancelCode:${userInfo.mail}`,
      code,
      60 * 5,
    )

    return mailRes
  }

  @ApiOperation({
    summary: '注销',
    description: '注销',
  })
  @Delete('cancel')
  async cancelByMail(
    @GetToken() token: TokenInfo,
    @Body() body: UserCancelDto,
  ) {
    const { code } = body
    const cacheCode = await this.redisService.get(
      `userCancelCode:${token.mail}`,
    )
    if (cacheCode !== code)
      throw new AppException(ResponseCode.ValidationFailed, 'The verification code does not exist')

    const res = await this.userService.delete(token.id)
    return res
  }

  @ApiOperation({
    summary: 'google登录注销',
    description: 'google登录注销',
  })
  @Post('cancel/google')
  async cancelByGoogle(@GetToken() payload: TokenInfo, @Body() loginInfo: GoogleLoginDto) {
    const { clientId, credential } = loginInfo

    const tokenInfo = {
      id: payload.id,
      mail: payload.mail,
      name: payload.name,
    }
    const token = this.authService.generateToken(tokenInfo)
    const cancelRes = this.userService.cancelLoginByGoogle(clientId, credential, token)
    this.logger.debug(cancelRes)

    const res = await this.userService.delete(tokenInfo.id)
    return res
  }
}

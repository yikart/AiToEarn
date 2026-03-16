import { Body, Controller, Delete, Get, Logger, Post, Put, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AitoearnAuthService, GetToken, Public, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc, AppException, ResponseCode } from '@yikart/common'
import { UserStatus } from '@yikart/mongodb'
import { RedisService } from '@yikart/redis'

import { RateLimit, RateLimitGuard } from '../../common/guards'
import { getRandomString } from '../../common/utils'
import { encryptPassword } from '../../common/utils/password.util'
import { config } from '../../config'
import {
  GoogleLoginDto,
  MailLoginDto,
  MailLoginSchema,
  MailRepasswordDto,
  MailRepasswordVerifyDto,
  MailRepasswordVerifySchema,
  MailVerifyDto,
  MailVerifySchema,
  PhoneLoginDto,
  PhoneVerifyDto,
  UserCancelDto,
} from './login.dto'
import { LoginService } from './login.service'
import { UserService } from './user.service'

@ApiTags('User/Login')
@Controller('login')
@UseGuards(RateLimitGuard)
export class LoginController {
  private readonly logger = new Logger(LoginController.name)
  constructor(
    private readonly authService: AitoearnAuthService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly loginService: LoginService,
  ) { }

  @ApiDoc({
    summary: '发送邮箱登录验证码',
    description: '向邮箱发送验证码，用于登录或注册。',
    body: MailLoginSchema,
  })
  @Public()
  @RateLimit({ ttl: 60, limit: 1, keyGenerator: req => `mailLogin:${req.body.mail}` })
  @Post('mail')
  async sendMailCode(@Body() body: MailLoginDto) {
    const { mail } = body

    const code = getRandomString(6, true)
    const mailRes = await this.loginService.sendLoginMail(mail, code)
    if (!mailRes)
      throw new AppException(ResponseCode.MailSendFail)

    const redisRes = await this.redisService.setJson(
      `userMailLogin:${mail}`,
      { code },
      60 * 5,
    )
    this.logger.log(`setJson userMailLogin:${mail} result: ${redisRes}, code: ${code}`)
  }

  @ApiDoc({
    summary: '邮箱验证码登录',
    description: '通过邮箱和验证码登录，新用户自动注册。',
    body: MailVerifySchema,
  })
  @Public()
  @RateLimit({ ttl: 60, limit: 5, keyGenerator: req => `mailVerify:${req.body.mail}` })
  @Post('mail/verify')
  async loginByMail(@Body() body: MailVerifyDto) {
    const { mail, code, inviteCode } = body

    const cacheData = await this.redisService.getJson<{ code: string }>(
      `userMailLogin:${mail}`,
    )
    if (!cacheData || cacheData.code !== code)
      throw new AppException(ResponseCode.UserLoginCodeError)

    await this.redisService.del(`userMailLogin:${mail}`)

    let userInfo = await this.userService.getUserInfoByMail(mail, true)
    const isNewUser = !userInfo || userInfo.isDelete

    if (!userInfo || userInfo.isDelete) {
      if (inviteCode) {
        const inviteUserInfo = await this.userService.getUserByPopularizeCode(inviteCode)
        if (!inviteUserInfo)
          throw new AppException(ResponseCode.UserLoginCodeError)
      }
      userInfo = await this.userService.createUserByMail(mail, inviteCode)
    }

    if (userInfo.status === UserStatus.STOP)
      throw new AppException(ResponseCode.UserStatusError)

    const token = this.authService.generateToken(userInfo)
    const tokenInfo = this.authService.decodeToken(token)

    this.userService.afterLogin(userInfo)

    return {
      type: isNewUser ? 'regist' : 'login',
      token,
      exp: tokenInfo.exp,
      userInfo,
    }
  }

  @ApiDoc({
    summary: '请求邮箱重置密码',
    description: '通过邮箱向用户发送重置验证码。',
    body: MailRepasswordDto.schema,
  })
  @Public()
  @RateLimit({ ttl: 300, limit: 3, keyGenerator: req => `repassword:${req.body.mail}` })
  @Post('repassword/mail')
  async repasswordByMail(@Body() body: MailRepasswordDto) {
    const { mail } = body

    const userInfo = await this.userService.getUserInfoByMail(mail)

    if (!userInfo || userInfo.isDelete)
      throw new AppException(ResponseCode.UserStatusError, 'The account does not exist')

    // 生成重置验证码
    const code = getRandomString(6, true)
    const rRes = await this.redisService.setJson(
      `userMailRepassword:${mail}`,
      { code, status: 0 },
      60 * 5,
    )
    if (!rRes)
      throw new AppException(ResponseCode.MailSendFail, 'Mail code add failed')

    // 发送包含验证码的邮件
    const mailRes = await this.loginService.sendRepasswordMail(
      mail,
      code,
    )
    if (!mailRes)
      throw new AppException(ResponseCode.MailSendFail, 'Mail sending failed')

    return config.environment === 'production' ? '' : code
  }

  @ApiDoc({
    summary: '通过邮箱重置密码',
    description: '使用邮箱验证码重置密码。',
    body: MailRepasswordVerifySchema,
  })
  @Public()
  @Put('repassword/mail')
  async getRepasswordByMailBack(@Body() body: MailRepasswordVerifyDto) {
    const { mail, code, password } = body

    const rRes = await this.redisService.getJson<{ code: string }>(
      `userMailRepassword:${mail}`,
    )
    if (!rRes || rRes.code !== code)
      throw new AppException(ResponseCode.ValidationFailed, 'The verification code is incorrect')

    const userInfo = await this.userService.getUserInfoByMail(mail)
    if (!userInfo || userInfo.isDelete)
      throw new AppException(ResponseCode.UserStatusError, 'The account does not exist')

    const { password: resPassword, salt: resSalt } = encryptPassword(password)

    const res = await this.userService.updatePasswordById(
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

  @ApiDoc({
    summary: '发送手机验证码',
    description: '向手机号发送短信验证码，用于登录或注册。',
    body: PhoneLoginDto.schema,
  })
  @Public()
  @RateLimit({ ttl: 60, limit: 1, keyGenerator: req => `phoneLogin:${req.body.phone}` })
  @Post('phone')
  async sendPhoneCode(@Body() body: PhoneLoginDto) {
    const { phone } = body

    const code = getRandomString(6, true)
    const smsRes = await this.loginService.sendLoginSms(phone, code)
    if (!smsRes)
      throw new AppException(ResponseCode.SmsSendFail)

    await this.redisService.setJson(
      `userPhoneLogin:${phone}`,
      { code },
      60 * 5,
    )
  }

  @ApiDoc({
    summary: '手机验证码登录',
    description: '通过手机号和验证码登录，新用户自动注册。',
    body: PhoneVerifyDto.schema,
  })
  @Public()
  @RateLimit({ ttl: 60, limit: 5, keyGenerator: req => `phoneVerify:${req.body.phone}` })
  @Post('phone/verify')
  async loginByPhone(@Body() body: PhoneVerifyDto) {
    const { phone, code } = body

    const cacheData = await this.redisService.getJson<{ code: string }>(
      `userPhoneLogin:${phone}`,
    )
    if (!cacheData || cacheData.code !== code)
      throw new AppException(ResponseCode.UserLoginCodeError)

    await this.redisService.del(`userPhoneLogin:${phone}`)

    let userInfo = await this.userService.getUserInfoByPhone(phone)
    const isNewUser = !userInfo

    if (!userInfo) {
      userInfo = await this.userService.createUserByPhone(phone)
    }

    if (userInfo.status === UserStatus.STOP)
      throw new AppException(ResponseCode.UserStatusError)

    const token = this.authService.generateToken(userInfo)
    const tokenInfo = this.authService.decodeToken(token)

    this.userService.afterLogin(userInfo)

    return {
      type: isNewUser ? 'regist' : 'login',
      token,
      exp: tokenInfo.exp,
      userInfo,
    }
  }

  @ApiDoc({
    summary: 'Google 登录',
    description: '使用 Google 凭证登录用户。',
    body: GoogleLoginDto.schema,
  })
  @Public()
  @RateLimit({ ttl: 60, limit: 10 })
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

  @ApiDoc({
    summary: '获取账号注销验证码',
    description: '向用户发送账号注销验证码。',
  })
  @Get('cancel/code')
  async getCancelMailCode(@GetToken() token: TokenInfo) {
    const userInfo = await this.userService.getUserInfoById(token.id)
    if (!userInfo || !userInfo.isDelete)
      throw new AppException(ResponseCode.UserStatusError)

    const code = getRandomString(6, true)

    // 发送包含验证码的邮件
    const mailRes = await this.loginService.sendCancelMail(
      userInfo.mail,
      code,
    )

    void this.redisService.set(
      `userCancelCode:${userInfo.mail}`,
      code,
      60 * 5,
    )

    return mailRes
  }

  @ApiDoc({
    summary: '注销账号',
    description: '使用验证码注销用户账号。',
    body: UserCancelDto.schema,
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

  @ApiDoc({
    summary: '取消 Google 登录绑定',
    description: '解除 Google 登录绑定并删除账号。',
    body: GoogleLoginDto.schema,
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
    await this.userService.cancelLoginByGoogle(clientId, credential, token)

    const res = await this.userService.delete(tokenInfo.id)
    return res
  }
}

import { ErrHttpBack } from '@common/filters/httpException.code'
import { OrgGuard } from '@common/interceptor/transform.interceptor'
import { getRandomString } from '@common/utils'
import { encryptPassword, validatePassWord } from '@common/utils/password.util'
import { MailService } from '@libs/mail/mail.service'
import { RedisService } from '@libs/redis/redis.service'
import { Body, Controller, Delete, Get, Post, Query, Render, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserStatus } from '@transports/user/comment'
import { GetToken, Public } from '@/auth/auth.guard'
import { AuthService } from '@/auth/auth.service'
import { TokenInfo } from '@/auth/interfaces/auth.interfaces'
import { config } from '@/config'
import {
  GetRegistByMailBackDto,
  GoogleLoginDto,
  MailLoginDto,
  MailRegistUrlDto,
  MailRepasswordDto,
  UserCancelDto,
} from './dto/login.dto'
import { UserService } from './user.service'
import { AppException } from '@/common/exceptions'

interface UserMailRegistCache {
  code: string
  status: 0 | 1
}

@ApiTags('用户登录-login')
@Controller('login')
export class LoginController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  @ApiOperation({
    summary: '邮箱登陆/注册',
    description: '邮箱登陆/注册',
  })
  @Public()
  @Post('mail')
  async loginByMail(@Body() loginInfo: MailLoginDto) {
    const { mail, password } = loginInfo

    const userInfo = await this.userService.getUserInfoByMail(mail, true)
    if (!!userInfo && userInfo.status !== UserStatus.DELETE) {
      if (userInfo.status === UserStatus.STOP)
        throw new AppException(ErrHttpBack.err_user_status)

      // 校验密码
      const isOk = validatePassWord(
        userInfo.password || '',
        userInfo.salt || '',
        password,
      )

      if (!isOk)
        throw new AppException(ErrHttpBack.err_user_password, 'password is error')
      const token = this.authService.generateToken(userInfo)
      const TokenInfo = this.authService.decodeToken(token)

      return {
        type: 'login',
        token,
        exp: TokenInfo.exp,
        userInfo,
      }
    }

    // 没有进行创建逻辑
    const code = getRandomString(6, true)

    // 发验证码邮件,邮箱号和code
    // const mailRes = await this.mailService.sendEmail({
    //   to: mail,
    //   subject: 'aitoearn regist',
    //   html: `<a href="${config.mailBackHost}/api/login/mail/regist/url?mail=${mail}&code=${code}">点击此处进行注册</a>`,
    // })
    const mailRes = await this.mailService.sendEmail({
      to: mail,
      subject: 'aitoearn regist',
      template: 'mail/regist',
      context: {
        url: `${config.mailBackHost}/api/login/mail/regist/url?mail=${mail}&code=${code}`,
      },
    })

    if (!mailRes)
      throw new AppException(ErrHttpBack.err_mail_send_fail)

    await this.redisService.setKey<UserMailRegistCache>(
      `userMailRegist:${mail}`,
      {
        code,
        status: 0,
      },
      60 * 10,
    )

    return {
      type: 'regist',
      code,
    }
  }

  @ApiOperation({
    summary: '邮箱注册确认',
    description: '用户点击链接后,进行注册,返回注册结果的html文本',
  })
  @Public()
  @UseGuards(OrgGuard)
  @Get('mail/regist/url')
  @Render('auth/regist')
  async registByMail(@Query() query: MailRegistUrlDto): Promise<{
    status: 0 | 1
    mail: string
  }> {
    const { mail, code } = query

    const hadCode = await this.redisService.get<UserMailRegistCache>(
      `userMailRegist:${mail}`,
    )

    if (
      process.env.NODE_ENV === 'production'
      && (!hadCode || hadCode.code !== code)
    ) {
      void this.redisService.del(`userMailRegist:${mail}`)
      return {
        status: 0,
        mail,
      }
    }

    const res = await this.redisService.setKey<UserMailRegistCache>(
      `userMailRegist:${mail}`,
      {
        code,
        status: 1,
      },
      60 * 10,
    )
    if (!res) {
      return {
        status: 0,
        mail,
      }
    }

    return {
      status: 1,
      mail,
    }
  }

  @ApiOperation({
    summary: '获取邮箱注册返回',
    description: '轮询获取',
  })
  @Public()
  @Post('mail/regist/back')
  async getRegistByMailBack(@Body() body: GetRegistByMailBackDto) {
    const { mail, code, inviteCode, password } = body
    const rData = await this.redisService.get<UserMailRegistCache>(
      `userMailRegist:${mail}`,
    )
    if (!rData)
      throw new AppException(ErrHttpBack.err_user_code_nohad)

    if (rData.status !== 1) {
      return {
        token: '',
      }
    }

    if (rData.code !== code)
      throw new AppException(ErrHttpBack.err_user_code_nohad)

    if (inviteCode) {
      const inviteUserInfo
        = await this.userService.getUserByPopularizeCode(inviteCode)
      if (!inviteUserInfo)
        throw new AppException(ErrHttpBack.err_user_pop_code_null)
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

    if (!userInfo || userInfo.status === UserStatus.DELETE)
      throw new AppException(ErrHttpBack.err_user_no_had)

    // 没有进行创建逻辑
    const code = getRandomString(6, true)

    const rRes = await this.redisService.setKey<UserMailRegistCache>(
      `userMailRepassword:${mail}`,
      { code, status: 0 },
      60 * 5,
    )
    if (!rRes)
      throw new AppException(ErrHttpBack.err_mail_send_fail)

    // 发验证码邮件,邮箱号和code
    const mailRes = await this.mailService.sendEmail({
      to: mail,
      subject: 'aitoearn repassword',
      template: 'mail/repassword',
      context: {
        url: `${config.mailBackHost}/api/login/repassword/mail/back/url?mail=${mail}&code=${code}`,
      },
    })

    if (!mailRes)
      throw new AppException(ErrHttpBack.err_mail_send_fail)

    return code
  }

  @ApiOperation({
    summary: '邮箱重设密码',
    description: '用户点击链接后,进行重设',
  })
  @Public()
  @UseGuards(OrgGuard)
  @Get('repassword/mail/back/url')
  @Render('auth/repassword')
  async repasswordUrlByMail(@Query() query: MailRegistUrlDto) {
    const { mail, code } = query

    const res = await this.redisService.get<UserMailRegistCache>(
      `userMailRepassword:${mail}`,
    )
    if (!res || res.code !== code) {
      return {
        status: 0,
        mail,
      }
    }

    void this.redisService.setKey(
      `userMailRepassword:${mail}`,
      { code, status: 1 },
      60 * 5,
    )

    return {
      status: 1,
      mail,
    }
  }

  @ApiOperation({
    summary: '邮箱重设密码',
    description: '轮询获取',
  })
  @Public()
  @Post('repassword/mail/back')
  async getRepasswordByMailBack(@Body() body: GetRegistByMailBackDto) {
    const { mail, code, password } = body

    const rRes = await this.redisService.get<UserMailRegistCache>(
      `userMailRepassword:${mail}`,
    )
    if (!rRes || rRes.code !== code)
      throw new AppException(ErrHttpBack.err_user_code_nohad)

    if (!rRes.status) {
      return {
        token: '',
      }
    }

    const userInfo = await this.userService.getUserInfoByMail(mail)
    if (!userInfo || userInfo.status === UserStatus.DELETE)
      throw new AppException(ErrHttpBack.err_user_had)

    const { password: resPassword, salt: resSalt } = encryptPassword(password)

    const res = await this.userService.updateUserPassword(
      userInfo.id,
      resPassword,
      resSalt,
    )

    if (!res)
      throw new AppException(ErrHttpBack.fail)

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
    if (!!userInfo && userInfo.status !== UserStatus.DELETE) {
      if (userInfo.status === UserStatus.STOP)
        throw new AppException(ErrHttpBack.err_user_status)
    }
    const tokenInfo = {
      id: userInfo.id,
      mail: userInfo.mail,
      name: userInfo.name,
    }
    const token = this.authService.generateToken(tokenInfo)
    const TokenInfo = this.authService.decodeToken(token)

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
    if (!userInfo || userInfo.status === UserStatus.DELETE)
      throw new AppException(ErrHttpBack.err_user_status)

    const code = getRandomString(6, true)

    // 发验证码邮件,邮箱号和code
    const mailRes = await this.mailService.sendEmail({
      to: userInfo.mail,
      subject: 'aitoearn cancel',
      html: `<p>您的注销验证码:${code}</p>`,
    })

    void this.redisService.setKey(
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
    const cacheCode = await this.redisService.get<string>(
      `userCancelCode:${token.mail}`,
    )
    if (cacheCode !== code)
      throw new AppException(ErrHttpBack.err_user_code_nohad)

    const res = await this.userService.updateUserStatus(token.id, UserStatus.DELETE)
    return res
  }
}

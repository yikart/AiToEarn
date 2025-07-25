import { ErrHttpBack } from '@common/filters/httpException.code'
import { AppHttpException } from '@common/filters/httpException.filter'
import { OrgGuard } from '@common/interceptor/transform.interceptor'
import { getRandomString } from '@common/utils'
import { validatePassWord } from '@common/utils/password.util'
import { MailService } from '@libs/mail/mail.service'
import { RedisService } from '@libs/redis/redis.service'
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { UserStatus } from '@transports/user/comment'
import { Public } from '@/auth/auth.guard'
import { AuthService } from '@/auth/auth.service'
import {
  GetRegistByMailBackDto,
  GoogleLoginDto,
  MailLoginDto,
  MailRegistUrlDto,
  MailRepasswordDto,
} from './dto/login.dto'
import { UserService } from './user.service'
import { config } from '@/config'

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
        throw new AppHttpException(ErrHttpBack.err_no_power_login)

      // 校验密码
      const isOk = validatePassWord(
        userInfo.password || '',
        userInfo.salt || '',
        password,
      )
      if (!isOk)
        throw new AppHttpException(ErrHttpBack.err_no_power_login)

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
    const mailRes = await this.mailService.sendEmail({
      to: mail,
      subject: 'aitoearn regist',
      html: `<a href="${config.mailBackHost}/api/login/mail/regist/url?mail=${mail}&code=${code}">点击此处进行注册</a>`,
    })

    if (!mailRes)
      throw new AppHttpException(ErrHttpBack.err_mail_send_fail)

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
  async registByMail(
    @Query() query: MailRegistUrlDto,
  ) {
    const { mail, code } = query

    const hadCode = await this.redisService.get<UserMailRegistCache>(
      `userMailRegist:${mail}`,
    )

    if (
      process.env.NODE_ENV === 'production'
      && (!hadCode || hadCode.code !== code)
    ) {
      void this.redisService.del(`userMailRegist:${mail}`)
      return `<h2>注册失效</h2>`
    }

    const res = await this.redisService.setKey<UserMailRegistCache>(
      `userMailRegist:${mail}`,
      {
        code,
        status: 1,
      },
      60 * 10,
    )
    if (!res)
      return `<h2>注册失效</h2>`

    return `<h2>注册成功</h2>`
  }

  @ApiOperation({
    summary: '获取邮箱注册返回',
    description: '轮询获取',
  })
  @Public()
  @Post('mail/regist/back')
  async getRegistByMailBack(
    @Body() body: GetRegistByMailBackDto,
  ) {
    const { mail, code, inviteCode, password } = body
    const rData = await this.redisService.get<UserMailRegistCache>(
      `userMailRegist:${mail}`,
    )
    if (!rData)
      throw new AppHttpException(ErrHttpBack.err_user_code_nohad)

    if (rData.status !== 1) {
      return {
        token: '',
      }
    }

    if (rData.code !== code)
      throw new AppHttpException(ErrHttpBack.err_user_code_nohad)

    if (inviteCode) {
      const inviteUserInfo
        = await this.userService.getUserByPopularizeCode(inviteCode)
      if (!inviteUserInfo)
        throw new AppHttpException(ErrHttpBack.err_user_pop_code_null)
    }

    // 创建新用户
    const userInfo = await this.userService.createUserByMail(
      mail,
      password,
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
  async repasswordByMail(
    @Body() body: MailRepasswordDto,
  ) {
    const { mail } = body

    const userInfo = await this.userService.getUserInfoByMail(mail)

    if (!userInfo || userInfo.status === UserStatus.DELETE)
      throw new AppHttpException(ErrHttpBack.err_user_no_had)

    // 没有进行创建逻辑
    const code = getRandomString(6, true)

    const rRes = await this.redisService.setKey<UserMailRegistCache>(
      `userMailRepassword:${mail}`,
      { code, status: 0 },
      60 * 5,
    )
    if (!rRes)
      throw new AppHttpException(ErrHttpBack.err_mail_send_fail)

    // 发验证码邮件,邮箱号和code
    const mailRes = await this.mailService.sendEmail({
      to: mail,
      subject: 'aitoearn repassword',
      html: `<a href="${process.env.NODE_ENV === 'production' ? 'https://api.aitoearn.cn' : 'http://127.0.0.1:7000'}/api/login/repassword/mail/back/url?mail=${mail}&code=${code}">点击此处进行重设</a>`,
    })

    if (!mailRes)
      throw new AppHttpException(ErrHttpBack.err_mail_send_fail)

    return code
  }

  @ApiOperation({
    summary: '邮箱重设密码',
    description: '用户点击链接后,进行重设',
  })
  @Public()
  @UseGuards(OrgGuard)
  @Get('repassword/mail/back/url')
  async repasswordUrlByMail(
    @Query() query: MailRegistUrlDto,
  ) {
    const { mail, code } = query

    const res = await this.redisService.get<UserMailRegistCache>(
      `userMailRepassword:${mail}`,
    )
    if (!res || res.code !== code)
      return `<h2>认证失效</h2>`

    void this.redisService.setKey(
      `userMailRepassword:${mail}`,
      { code, status: 1 },
      60 * 5,
    )

    return `<h2>认证成功/h2>`
  }

  @ApiOperation({
    summary: '邮箱重设密码',
    description: '轮询获取',
  })
  @Public()
  @Post('repassword/mail/back')
  async getRepasswordByMailBack(
    @Body() body: GetRegistByMailBackDto,
  ) {
    const { mail, code, password } = body

    const rRes = await this.redisService.get<UserMailRegistCache>(
      `userMailRepassword:${mail}`,
    )
    if (!rRes || rRes.code !== code)
      throw new AppHttpException(ErrHttpBack.err_user_code_nohad)

    if (!rRes.status) {
      return {
        token: '',
      }
    }

    const userInfo = await this.userService.getUserInfoByMail(mail)
    if (!userInfo || userInfo.status === UserStatus.DELETE)
      throw new AppHttpException(ErrHttpBack.err_user_had)

    const res = await this.userService.updateUserPassword(
      userInfo.id,
      password,
    )

    if (!res)
      throw new AppHttpException(ErrHttpBack.fail)

    const token = this.authService.generateToken(userInfo)
    const TokenInfo = this.authService.decodeToken(token)

    return {
      token,
      exp: TokenInfo.exp,
      userInfo,
    }
  }

  @ApiOperation({
    summary: '邮箱注册确认',
    description: '用户点击链接后,进行注册,返回注册结果的html文本',
  })
  @Public()
  @UseGuards(OrgGuard)
  @Get('ttt')
  async tttt() {
    // 没有进行创建逻辑
    const code = getRandomString(6, true)

    // 发验证码邮件,邮箱号和code
    const mailRes = await this.mailService.sendEmail({
      to: '861796052@qq.com',
      subject: 'aitoearn regist',
      html: `<a href="https://api.aitoearn.cn/api/login/mail/regist/url?&code=${code}">点击此处进行注册</a>`,
    })

    return mailRes ? '发送成功' : '发送失败'
  }

  @ApiOperation({
    summary: 'google登录',
    description: 'google登录',
  })
  @Public()
  @Post('google')
  async loginByGoogle(
    @Body() loginInfo: GoogleLoginDto,
  ) {
    const { clientId, credential } = loginInfo
    console.log('google 登录')
    const userInfo = await this.userService.getUserInfoByGoogle(
      clientId,
      credential,
    )
    console.log('google 登录', userInfo)
    if (!!userInfo && userInfo.status !== UserStatus.DELETE) {
      if (userInfo.status === UserStatus.STOP)
        throw new AppHttpException(ErrHttpBack.err_no_power_login)
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
}

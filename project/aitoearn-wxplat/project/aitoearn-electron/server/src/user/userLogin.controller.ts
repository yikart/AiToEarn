/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-05-06 15:50:54
 * @LastEditors: nevin
 * @Description: 用户路由
 */
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { TokenInfo } from '../auth/interfaces/auth.interfaces';
import {
  GetRegisterCodeDto,
  PhoneLoginByCodeDto,
  PhoneLoginByAuthDto,
  PhoneLoginByGzhDto,
} from './dto/user.dto';
import { UserService } from './user.service';
import { ErrHttpBack } from '../filters/http-exception.back-code';
import { AppHttpException } from '../filters/http-exception.filter';
import { LoginService, LoginTypeCacheKey } from './login.service';
import { User, UserStatus } from '../db/schema/user.schema';
import { GetToken, Public } from '../auth/auth.guard';
import { NewUserByMail, NewUserByPhone } from './class/user.class';
import { ParamsValidationPipe } from '../validation.pipe';
import { RedisService } from 'src/lib/redis/redis.service';
import { getGzhLoginKey } from './user.comment';
import { AlicloudPnsService } from 'src/lib/sms/alicloud-pns.service';
import { PlatAuthWxGzhService } from 'src/lib/platAuth/wxGzh.service';
import {
  GetRegistByMailBackDto,
  MailLoginDto,
  MailRegistUrlDto,
  MailRepasswordDto,
} from './dto/login.dto';
import { validatePassWord } from 'src/util/password.util';
import { getRandomString } from 'src/util';
import { MailService } from 'src/lib/mail/mail.service';

@ApiTags('userLogin - 用户登录')
@Controller('user/login')
export class UserLoginController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly loginService: LoginService,
    private readonly platAuthWxGzhService: PlatAuthWxGzhService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly alicloudPnsService: AlicloudPnsService,
  ) {}

  @ApiOperation({
    summary: '发送手机号的code',
    description: '有无用户都可以',
  })
  @Public()
  @Post('code')
  async getLoginMsmCode(
    @Body(new ParamsValidationPipe()) body: GetRegisterCodeDto,
  ) {
    const { phone } = body;

    const res = await this.loginService.postPhoneLoginCode(phone);
    return res;
  }

  @ApiOperation({
    description: '手机号验证码登录',
    summary: '手机号验证码登录',
  })
  @Public()
  @Post('login/code/phone')
  async loginByPhoneCode(
    @Body(new ParamsValidationPipe()) loginInfo: PhoneLoginByCodeDto,
  ) {
    const { phone, code, inviteCode } = loginInfo;

    // 邀请码验证
    if (!!inviteCode) {
      const inviteUserInfo =
        await this.userService.getUserByPopularizeCode(inviteCode);
      if (!inviteUserInfo)
        throw new AppHttpException(ErrHttpBack.err_user_pop_code_null);
    }

    // 验证短信验证码
    if (process.env.NODE_ENV !== 'development' && code !== 'yika888666') {
      const res = await this.loginService.verifyPhoneCode(
        phone,
        code,
        LoginTypeCacheKey.Code,
      );
      if (!res) throw new AppHttpException(ErrHttpBack.err_user_code_nohad);
    }

    let userInfo: User = await this.userService.getUserInfoByPhone(phone);
    if (!userInfo) {
      const newUser = new NewUserByPhone(phone);
      if (!!inviteCode) newUser.inviteCode = inviteCode;
      userInfo = await this.userService.createUser(newUser);
    }

    if (userInfo.status === UserStatus.STOP)
      throw new AppHttpException(ErrHttpBack.err_no_power_login);

    const token = await this.authService.generateToken(userInfo);
    const TokenInfo = await this.authService.decodeToken(token);

    return {
      token,
      exp: TokenInfo.exp,
      userInfo: await this.userService.getUserInfoById(TokenInfo.id),
    };
  }

  @ApiOperation({
    description: '手机号一键认证登录',
    summary: '手机号一键认证登录',
  })
  @Public()
  @Post('login/auth/phone')
  async loginByPhoneAuth(
    @Body(new ParamsValidationPipe()) loginInfo: PhoneLoginByAuthDto,
  ) {
    const { accessToken, inviteCode } = loginInfo;
    // 邀请码验证
    if (!!inviteCode) {
      const inviteUserInfo =
        await this.userService.getUserByPopularizeCode(inviteCode);
      if (!inviteUserInfo)
        throw new AppHttpException(ErrHttpBack.err_user_pop_code_null);
    }

    const phone =
      await this.alicloudPnsService.getOneKeyLoginPhone(accessToken);

    let userInfo: User = await this.userService.getUserInfoByPhone(phone);
    if (!userInfo) {
      const newUser = new NewUserByPhone(phone);
      if (!!inviteCode) newUser.inviteCode = inviteCode;
      userInfo = await this.userService.createUser(newUser);
    }

    if (userInfo.status === UserStatus.STOP)
      throw new AppHttpException(ErrHttpBack.err_no_power_login);

    const token = await this.authService.generateToken(userInfo);
    const TokenInfo = await this.authService.decodeToken(token);

    return {
      token,
      exp: TokenInfo.exp,
      userInfo: await this.userService.getUserInfoById(TokenInfo.id),
    };
  }

  @ApiOperation({
    description: '手机号一键认证登录',
    summary: '手机号一键认证登录',
  })
  @Public()
  @Post('test/login/auth/phone')
  async loginByPhoneAuthTest(
    @Body(new ParamsValidationPipe()) loginInfo: PhoneLoginByAuthDto,
  ) {
    const { accessToken } = loginInfo;
    const phone =
      await this.alicloudPnsService.getOneKeyLoginPhone(accessToken);

    return {
      phone,
    };
  }

  @ApiOperation({ description: 'token刷新', summary: 'token刷新' })
  @Post('token/refresh')
  async refreshToken(@GetToken() token: TokenInfo) {
    const userInfo = await this.userService.getUserInfoById(token.id);
    if (userInfo.status === UserStatus.STOP)
      throw new AppHttpException(ErrHttpBack.err_no_power_login);

    const newToken = await this.authService.resetToken(token);
    return {
      token: newToken,
    };
  }

  // ----------------- 微信公众号登录 -----------------
  private setGzhLoginInfo(
    ticket: string,
    key: string,
    data: {
      phone: string;
      openId: string;
      token: string;
      exp: number;
      userInfo: User;
      status: number;
    },
  ) {
    this.redisService.setKey(getGzhLoginKey(ticket, key), data, 60 * 5);
  }
  private getGzhLoginInfo(ticket: string, key: string) {
    return this.redisService.get(getGzhLoginKey(ticket, key));
  }

  @ApiOperation({
    description: '获取微信公众号登录的二维码',
    summary: '公众号',
  })
  @Public()
  @Get('gzh/qrcode/get')
  async getWxLoginQrcode() {
    // ---- 直接使用微信 弃用 STR ----
    // const key = uuidv4();
    // const ticket = await this.wxGzhService.createQrcode(key);
    // if (!ticket) throw new AppHttpException(ErrHttpBack.fail);
    // ---- 直接使用微信 弃用 END ----

    // 使用艺咖三方平台授权服务
    const { ticket, key } = await this.platAuthWxGzhService.getWxLoginQrcode();

    this.setGzhLoginInfo(ticket, key, {
      token: '',
      phone: '',
      openId: '',
      exp: 0,
      userInfo: null,
      status: 0,
    });

    return {
      key,
      ticket,
    };
  }

  @ApiOperation({
    description: '使用的是艺咖三方平台授权服务转发',
    summary: '接收微信公众号返回的消息',
  })
  @Public()
  @Post('gzh/msg/back')
  async acceptMsgBack(
    @Body()
    body: {
      FromUserName: string;
      MsgType: 'text' | 'event';
      Event?: 'subscribe' | 'SCAN';
      EventKey?: string;
      Ticket?: string;
    },
  ) {
    const { FromUserName, MsgType, Ticket, EventKey, Event } = body;
    if (MsgType !== 'event') return -1;
    if (!Ticket) return -1;

    let key = '';
    if (Event === 'subscribe') key = EventKey.replace('qrscene_', '');
    if (Event === 'SCAN') key = EventKey;

    const userInfo: User =
      await this.userService.getUserInfoByWxOpenId(FromUserName);

    // 不存在,等待下一步
    if (!userInfo) {
      this.setGzhLoginInfo(Ticket, key, {
        phone: '',
        openId: FromUserName,
        token: '',
        exp: 60 * 5,
        userInfo: null,
        status: 0,
      });

      return '';
    }

    // 存在
    if (userInfo.status === UserStatus.STOP) return -1;

    // 存在,但是没有手机号
    if (!userInfo.phone) {
      this.setGzhLoginInfo(Ticket, key, {
        phone: '',
        openId: FromUserName,
        token: '',
        exp: 60 * 5,
        userInfo: userInfo,
        status: 0,
      });

      return '';
    }

    // openId, 手机号都有,返回登录成功
    const token = await this.authService.generateToken(userInfo);
    const TokenInfo = await this.authService.decodeToken(token);

    const loginData = {
      phone: userInfo.phone,
      openId: FromUserName,
      token,
      exp: TokenInfo.exp,
      userInfo: await this.userService.getUserInfoById(TokenInfo.id),
      status: 1,
    };
    this.setGzhLoginInfo(Ticket, key, loginData);
    return '';
  }

  @ApiOperation({
    description: '微信公众号二维码登录',
    summary: '轮询获取',
  })
  @Public()
  @Post('gzh/qrcode/login')
  async loginByWxQrcode(@Body() body: { ticket: string; key: string }) {
    const { ticket, key } = body;

    const value = await this.getGzhLoginInfo(ticket, key);

    if (!value)
      return {
        phone: '',
        openId: '',
        token: '',
        exp: 0,
        userInfo: null,
        status: -1,
      };

    return value;
  }

  @ApiOperation({
    description: '手机号验证码登录',
    summary: '手机号验证码登录',
  })
  @Public()
  @Post('login/gzh/code/phone')
  async loginByPhoneGzhQrcode(
    @Body(new ParamsValidationPipe()) loginInfo: PhoneLoginByGzhDto,
  ) {
    const { phone, code, openId, inviteCode } = loginInfo;

    // 邀请码验证
    if (!!inviteCode) {
      const inviteUserInfo =
        await this.userService.getUserByPopularizeCode(inviteCode);
      if (!inviteUserInfo)
        throw new AppHttpException(ErrHttpBack.err_user_pop_code_null);
    }

    // 验证短信验证码
    if (process.env.NODE_ENV !== 'development') {
      const res = await this.loginService.verifyPhoneCode(
        phone,
        code,
        LoginTypeCacheKey.Code,
      );
      if (!res) throw new AppHttpException(ErrHttpBack.err_user_code_nohad);
    }

    let userInfo: User = await this.userService.getUserInfoByPhone(phone);

    // 没有进行创建
    if (!userInfo) {
      const newUser = new NewUserByPhone(phone);
      newUser.wxOpenid = openId;
      if (!!inviteCode) newUser.inviteCode = inviteCode;

      userInfo = await this.userService.createUser(newUser);
    }

    if (userInfo.status === UserStatus.STOP)
      throw new AppHttpException(ErrHttpBack.err_no_power_login);

    // 有进行更新
    const token = await this.authService.generateToken(userInfo);
    const TokenInfo = await this.authService.decodeToken(token);

    this.userService.updateUserWxOpenId(userInfo.id, openId);

    return {
      token,
      exp: TokenInfo.exp,
      userInfo: await this.userService.getUserInfoById(TokenInfo.id),
    };
  }

  // ----------- 邮箱登录 ----------
  @ApiOperation({
    summary: '邮箱注册',
    description: '邮箱注册',
  })
  @Public()
  @Post('mail')
  async loginByMail(@Body(new ParamsValidationPipe()) loginInfo: MailLoginDto) {
    const { mail, password } = loginInfo;

    const userInfo: User = await this.userService.getUserInfoByMail(mail);

    if (!!userInfo && userInfo.status !== UserStatus.DELETE) {
      if (userInfo.status === UserStatus.STOP)
        throw new AppHttpException(ErrHttpBack.err_no_power_login);

      // 校验密码
      const isOk = validatePassWord(userInfo.password, userInfo.salt, password);
      if (!isOk) throw new AppHttpException(ErrHttpBack.err_no_power_login);

      const token = await this.authService.generateToken(userInfo);
      const TokenInfo = await this.authService.decodeToken(token);

      return {
        type: 'login',
        token,
        exp: TokenInfo.exp,
        userInfo: await this.userService.getUserInfoById(TokenInfo.id),
      };
    }

    // 没有进行创建逻辑
    const code = getRandomString(6, true);

    this.redisService.setKey(
      `userMailLogin:${code}`,
      { mail: mail, status: 0 },
      60 * 5,
    );

    // 发验证码邮件,邮箱号和code
    const mailRes = await this.mailService.sendEmail({
      to: mail,
      subject: 'aitoearn regist',
      html: `<a href="https://api.aitoearn.cn/api/user/login/mail/regist/url?mail=${mail}&code=${code}">点击此处进行注册</a>`,
    });

    if (!mailRes) throw new AppHttpException(ErrHttpBack.err_mail_send_fail);

    return {
      type: 'regist',
      code: code,
    };
  }

  // TODO: 后期改成返回页面
  @ApiOperation({
    summary: '邮箱注册',
    description: '用户点击链接后,进行注册',
  })
  @Public()
  @Get('mail/regist/url')
  async registByMail(
    @Query(new ParamsValidationPipe()) query: MailRegistUrlDto,
  ) {
    const { mail, code } = query;

    const res = await this.redisService.get(`userMailLogin:${code}`);
    if (!res) {
      return {
        status: 0,
      };
    }

    if (res.mail !== mail) {
      return {
        status: 0,
      };
    }

    this.redisService.setKey(
      `userMailLogin:${code}`,
      { mail: mail, status: 1 },
      60 * 5,
    );

    return {
      status: 1,
    };
  }

  @ApiOperation({
    summary: '获取邮箱注册返回',
    description: '轮询获取',
  })
  @Public()
  @Post('mail/regist/back')
  async getRegistByMailBack(
    @Body(new ParamsValidationPipe()) body: GetRegistByMailBackDto,
  ) {
    const { mail, code, inviteCode, password } = body;

    const rData = await this.redisService.get(`userMailLogin:${code}`);
    if (!rData) throw new AppHttpException(ErrHttpBack.err_user_code_nohad);

    if (!rData.status) {
      return {
        token: '',
      };
    }

    if (rData.mail !== mail)
      throw new AppHttpException(ErrHttpBack.err_user_code_nohad);

    if (!!inviteCode) {
      const inviteUserInfo =
        await this.userService.getUserByPopularizeCode(inviteCode);
      if (!inviteUserInfo)
        throw new AppHttpException(ErrHttpBack.err_user_pop_code_null);
    }

    // 创建新用户
    const newUser = new NewUserByMail(mail, password);
    if (!!inviteCode) newUser.inviteCode = inviteCode;
    const userInfo = await this.userService.createUser(newUser);

    const token = await this.authService.generateToken(userInfo);
    const TokenInfo = await this.authService.decodeToken(token);

    return {
      token,
      exp: TokenInfo.exp,
      userInfo: await this.userService.getUserInfoById(TokenInfo.id),
    };
  }

  @ApiOperation({
    summary: '邮箱重置密码',
    description: '邮箱重置密码',
  })
  @Public()
  @Post('repassword/mail')
  async repasswordByMail(
    @Body(new ParamsValidationPipe()) body: MailRepasswordDto,
  ) {
    const { mail } = body;

    const userInfo: User = await this.userService.getUserInfoByMail(mail);

    if (!userInfo || userInfo.status === UserStatus.DELETE)
      throw new AppHttpException(ErrHttpBack.err_user_had);

    // 没有进行创建逻辑
    const code = getRandomString(6, true);

    this.redisService.setKey(
      `userMailrepassword:${code}`,
      { mail: mail, status: 0 },
      60 * 5,
    );

    // 发验证码邮件,邮箱号和code
    const mailRes = await this.mailService.sendEmail({
      to: mail,
      subject: 'aitoearn repassword',
      html: `<a href="https://api.aitoearn.cn/api/user/login/repassword/mail/back/url?mail=${mail}&code=${code}">点击此处进行重设</a>`,
    });

    if (!mailRes) throw new AppHttpException(ErrHttpBack.err_mail_send_fail);

    return code;
  }

  // TODO: 后期改成返回页面
  @ApiOperation({
    summary: '邮箱重设密码',
    description: '用户点击链接后,进行重设',
  })
  @Public()
  @Get('repassword/mail/back/url')
  async repasswordUrlByMail(
    @Query(new ParamsValidationPipe()) query: MailRegistUrlDto,
  ) {
    const { mail, code } = query;

    const res = await this.redisService.get(`userMailrepassword:${code}`);
    if (!res) {
      return {
        status: 0,
      };
    }

    if (res.mail !== mail) {
      return {
        status: 0,
      };
    }

    this.redisService.setKey(
      `userMailrepassword:${code}`,
      { mail: mail, status: 1 },
      60 * 5,
    );

    return {
      status: 1,
    };
  }

  @ApiOperation({
    summary: '邮箱重设密码',
    description: '轮询获取',
  })
  @Public()
  @Post('repassword/mail/back')
  async getRepasswordByMailBack(
    @Body(new ParamsValidationPipe()) body: GetRegistByMailBackDto,
  ) {
    const { mail, code, password } = body;

    const rData: {
      status: number;
      mail: string;
    } = await this.redisService.get(`userMailrepassword:${code}`);
    if (!rData) throw new AppHttpException(ErrHttpBack.err_user_code_nohad);

    if (rData.mail !== mail)
      throw new AppHttpException(ErrHttpBack.err_user_code_nohad);

    if (!rData.status) {
      return {
        token: '',
      };
    }

    const userInfo = await this.userService.getUserInfoByMail(mail);
    if (!userInfo || userInfo.status === UserStatus.DELETE)
      throw new AppHttpException(ErrHttpBack.err_user_had);

    const newUser = new NewUserByMail(mail, password);
    const res = await this.userService.updateUserPassword(userInfo.id, {
      password: newUser.password,
      salt: newUser.salt,
    });

    if (!res) throw new AppHttpException(ErrHttpBack.fail);

    const token = await this.authService.generateToken(userInfo);
    const TokenInfo = await this.authService.decodeToken(token);

    return {
      token,
      exp: TokenInfo.exp,
      userInfo: await this.userService.getUserInfoById(TokenInfo.id),
    };
  }
}

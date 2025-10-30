/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2025-02-26 09:58:29
 * @LastEditors: nevin
 * @Description: 微信公众号事件接受
 */
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from 'src/auth/auth.guard';
import { OrgGuard } from 'src/interceptor/transform.interceptor';
import { WxGzhService } from 'src/lib/wx/wxGzh.service';
import { RedisService } from 'src/lib/redis/redis.service';
import { User, UserStatus } from 'src/db/schema/user.schema';
import { UserService } from './user.service';
import { NewUserByWx } from './class/user.class';
import { AuthService } from 'src/auth/auth.service';
import { getGzhLoginKey } from './user.comment';

@Controller('wxGzh')
export class WxGzhController {
  constructor(
    private readonly wxGzhService: WxGzhService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {}

  @Public()
  @UseGuards(OrgGuard)
  @Get('msg')
  async checkMsg(
    @Query()
    query: {
      signature: string;
      echostr: string;
      timestamp: string;
      nonce: string;
    },
  ) {
    const res = await this.wxGzhService.checkCallback(query);
    return res;
  }

  // 接收微信公众号的消息
  // 消息(暂不处理)
  // {
  //   ToUserName: 'gh_6fd6e64e6e8f',
  //   FromUserName: 'oPgBP7GGjJIlm3d2xxoIuUOG1iEs',
  //   CreateTime: '1740498823',
  //   MsgType: 'text',
  //   Content: 'Nih',
  //   MsgId: '24917948940934036'
  // }

  // 进行关注
  // {
  //   ToUserName: 'gh_6fd6e64e6e8f',
  //   FromUserName: 'oPgBP7GGjJIlm3d2xxoIuUOG1iEs',
  //   CreateTime: '1740498747',
  //   MsgType: 'event',
  //   Event: 'subscribe',
  //   EventKey: 'qrscene_1',
  //   Ticket: 'gQG18TwAAAAAAAAAAS5odHRwOi8vd2VpeGluLnFxLmNvbS9xLzAydUhSdTFsLTBkZkkxLTJ5NmhEMTYAAgQCqL1nAwSAOgkA'
  // }

  // 扫码
  // {
  //   ToUserName: 'gh_6fd6e64e6e8f',
  //   FromUserName: 'oPgBP7GGjJIlm3d2xxoIuUOG1iEs',
  //   CreateTime: '1740498973',
  //   MsgType: 'event',
  //   Event: 'SCAN',
  //   EventKey: '1',
  //   Ticket: 'gQG18TwAAAAAAAAAAS5odHRwOi8vd2VpeGluLnFxLmNvbS9xLzAydUhSdTFsLTBkZkkxLTJ5NmhEMTYAAgQCqL1nAwSAOgkA'
  // }
  @Public()
  @UseGuards(OrgGuard)
  @Post('msg')
  async acceptMsg(
    @Query()
    query: {
      signature: string;
      timestamp: string;
      nonce: string;
    },
    @Body()
    body: {
      FromUserName: string;
      MsgType: 'text' | 'event';
      Event?: 'subscribe' | 'SCAN';
      EventKey?: string;
      Ticket?: string;
    },
  ) {
    console.log('------------ body', body);

    const { FromUserName, MsgType, Ticket, EventKey, Event } = body;
    if (MsgType !== 'event') return '';
    if (!Ticket) return '';

    let key = '';
    if (Event === 'subscribe') key = EventKey.replace('qrscene_', '');
    if (Event === 'SCAN') key = EventKey;

    let userInfo: User =
      await this.userService.getUserInfoByWxOpenId(FromUserName);

    if (!userInfo) {
      const newUser = new NewUserByWx({
        openid: FromUserName,
      });
      userInfo = await this.userService.createUser(newUser);
    }

    if (userInfo.status === UserStatus.STOP) return '';

    const token = await this.authService.generateToken(userInfo);
    const TokenInfo = await this.authService.decodeToken(token);
    const loginData = {
      token,
      exp: TokenInfo.exp,
      userInfo: await this.userService.getUserInfoById(TokenInfo.id),
    };

    this.redisService.setKey(getGzhLoginKey(Ticket, key), loginData, 60 * 5);
    return '';
  }
}

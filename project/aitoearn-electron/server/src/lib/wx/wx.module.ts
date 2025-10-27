/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:27
 * @LastEditTime: 2025-02-25 09:47:37
 * @LastEditors: nevin
 * @Description:
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WxService } from './wx.service';
import wxConfig from '../../../config/wx.config';
import { WxPayService } from './wxPay.service';
import { WeChatPayModule } from 'nest-wechatpay-node-v3';
import { WxGzhService } from './wxGzh.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [wxConfig], // 加载自定义配置项
    }),
    WeChatPayModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          appid: configService.get('WX_CONFIG.APP_ID'),
          mchid: configService.get('WX_CONFIG.MCH_ID'),
          publicKey: configService.get('WX_CONFIG.PUBLIC_KEY'),
          privateKey: configService.get('WX_CONFIG.PRIVATE_KEY'),
        };
      },
    }),
  ],
  providers: [WxService, WxPayService, WxGzhService],
  exports: [WxService, WxPayService, WxGzhService],
})
export class WxModule {}

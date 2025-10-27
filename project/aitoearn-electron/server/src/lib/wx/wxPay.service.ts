/*
 * @Author: nevin
 * @Date: 2024-06-17 16:12:56
 * @LastEditTime: 2024-07-30 17:50:07
 * @LastEditors: nevin
 * @Description: 微信服务
 */
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WxPay from 'wechatpay-node-v3';
import { WECHAT_PAY_MANAGER } from 'nest-wechatpay-node-v3';
import { sleep } from '../../util';

@Injectable()
export class WxPayService {
  appId = '';
  mchId = '';
  notifyUrl = '';
  key = '';
  constructor(
    private readonly configService: ConfigService,
    @Inject(WECHAT_PAY_MANAGER) private wxPay: WxPay,
  ) {
    this.appId = this.configService.get('WX_CONFIG.APP_ID');
    this.mchId = this.configService.get('WX_CONFIG.MCH_ID');
    this.notifyUrl = this.configService.get('WX_CONFIG.NOTIFY_URL');
    this.key = this.configService.get('WX_CONFIG.KEY');
  }

  /**
   * 小程序下单
   * @param openid
   * @param money
   * @returns
   */
  async miniAppToPay(
    openid: string,
    money: number,
    outTradeNo: string,
    description: string,
  ): Promise<any> {
    if (process.env.NODE_ENV !== 'production') {
      money = 0.01;
    }
    const params = {
      appid: this.appId,
      mchid: this.mchId,
      description: description,
      out_trade_no: outTradeNo,
      notify_url: this.notifyUrl,
      amount: {
        total: money * 100,
      },
      payer: {
        openid: openid,
      },
    };
    const result = await this.wxPay.transactions_jsapi(params);
    if (result.error) {
      Logger.error(result.error);
      return null;
    }

    return result.data;
  }

  async appToPay(money: number, outTradeNo: string, description: string) {
    const params = {
      appid: this.appId,
      mchid: this.mchId,
      description: description,
      out_trade_no: outTradeNo,
      notify_url: this.notifyUrl,
      amount: {
        total: money * 100,
        // total: money, // TODO: 测试使用1分钱
      },
      payer: {},
    };
    const result = await this.wxPay.transactions_app(params);
    if (result.error) {
      Logger.error(result.error);
      return null;
    }

    return result.data;
  }

  async decipherGcm(
    ciphertext: string,
    associated_data: string,
    nonce: string,
    key?: string,
  ): Promise<{
    out_trade_no: string;
    trade_state: string; // 'SUCCESS'
    amount: {
      total: number;
    };
  }> {
    try {
      if (!key) key = this.key;

      return this.wxPay.decipher_gcm(ciphertext, associated_data, nonce, key);
    } catch (error) {
      console.log('===decipherGcm==', error);
      Logger.error(error);

      return null;
    }
  }

  /**
   * 发送红包
   * @param openId
   * @param transAmount 金额 单位元
   * @param outBizNo 业务单号
   * @param retry
   * @returns
   */
  async sendRedPacket(
    openId: string,
    transAmount: number,
    outBizNo: string,
    retry = 0,
  ) {
    const result = await this.wxPay.batches_transfer({
      out_batch_no: outBizNo,
      batch_name: '提现红包',
      batch_remark: '提现红包',
      total_amount: transAmount * 100,
      total_num: 1,
      transfer_detail_list: [
        {
          out_detail_no: outBizNo,
          transfer_amount: transAmount * 100,
          transfer_remark: '提现红包',
          openid: openId,
        },
      ],
    });

    if (result.status === 200) {
      return result;
    } else if (result.error === 'SYSTEM_ERROR' && result.status === 500) {
      Logger.error('系统错误', 'SYSTEM_ERROR', 'wxPayService', result);
      if (retry > 5) {
        throw new HttpException('系统错误', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      await sleep((retry + 1) * 1000);
      return await this.sendRedPacket(
        openId,
        transAmount,
        outBizNo,
        (retry = retry + 1),
      );
    } else {
      Logger.error('系统错误', 'wxPayService', result);
      return null;
    }
  }
}

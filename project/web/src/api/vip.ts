import { request } from '@/utils/request';

// 会员类型枚举
export enum VipCycleType {
  MONTH = 1,  // 月卡会员
  YEAR = 2,   // 年卡会员
}

// 支付类型枚举
export enum PaymentType {
  MONTH = 'month',        // 月度订阅
  YEAR = 'year',          // 年度订阅
  ONCE_MONTH = 'onceMonth', // 一次性月度
  ONCE_YEAR = 'onceYear',   // 一次性年度
  POINTS = 'points'       // 积分购买
}

// 创建支付订单参数接口
export interface CreatePaymentOrderParams {
  success_url?: string;
  returnTo?: string;
  mode: string;
  payment: PaymentType;
  quantity?: number; // 购买数量，用于积分购买
  metadata: {
    userId: string;
  };
}

// 创建支付订单
export const createPaymentOrderApi = (params: CreatePaymentOrderParams) => {
  return request({
    url: 'payment/checkout',
    method: 'POST',
    data: params
  });
};

// 设置会员类型
export const setVipApi = (cycleType: VipCycleType) => {
  return request({
    url: 'user/vip/set',
    method: 'PUT',
    data: {
      cycleType
    }
  });
};
import { request } from '@/utils/request';

// 会员类型枚举
export enum VipCycleType {
  MONTH = 1,  // 月卡会员
  YEAR = 2,   // 年卡会员
}

// 设置会员类型
export const setVipApi = (cycleType: VipCycleType) => {
  return request({
    url: '/user/vip/set',
    method: 'PUT',
    data: {
      cycleType
    }
  });
};
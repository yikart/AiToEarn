import { request } from '@/utils/request';
import { WithdrawRecord } from './types/withdraw';

/**
 * 获取提现列表
 */
export const apiGetWithdrawRecordList = (page: {pageNo: number, pageSize: number}, params: { status?: number }) => {
  return request<{list: WithdrawRecord[], total: number}>({
    url: `withdraw/list/${page.pageNo}/${page.pageSize}`,
    method: 'GET',
    params
  });
};

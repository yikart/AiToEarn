import { request } from '@/utils/request';
import { IncomeRecord } from './types/income';

/**
 * 获取收入列表
 */
export const apiGetIncomeList = (page: {
  pageNo: number;
  pageSize: number;
}, params: {
  type?: string
}) => {
  return request<{ list: IncomeRecord[], tatol: number }>({
    url: `income/list/${page.pageNo}/${page.pageSize}`,
    method: 'GET',
    params
  });
};

/**
 * 提交提现
 */
export const apiSubmitWithdraw = (incomeRecordId: string, flowId?: string) => {
  return request<any>({
    url: `income/withdraw`,
    method: 'POST',
    data: {
      incomeRecordId,
      flowId
    }
  });
};
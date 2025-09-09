import { request } from '@/utils/request';
import { IncomeRecord } from './types/income';

/**
 * 获取收入列表
 */
export const apiGetIncomeList = (page: {
  pageNo: number;
  pageSize: number;
}, params: {
  status?: number
}) => {
  return request<{ list: IncomeRecord[], tatol: number }>({
    url: `income/list/${page.pageNo}/${page.pageSize}`,
    method: 'GET',
    params
  });
};
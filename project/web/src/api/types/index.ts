/*
 * @Author: nevin
 * @Date: 2025-02-22 12:07:07
 * @LastEditTime: 2025-02-22 12:07:24
 * @LastEditors: nevin
 * @Description:
 */
export interface ApiCorrectQuery {
  pageSize: number;
  pageNo: number;
}

export interface IPaginationMeta {
  itemCount: number;
  totalItems?: number;
  itemsPerPage: number;
  totalPages?: number;
  currentPage: number;
}

export class Pagination<T> {
  constructor(
    public readonly items: T[],
    public readonly meta: IPaginationMeta,
  ) {}
}

// 导出支付相关类型
export * from './payment';

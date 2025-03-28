/*
 * @Author: nevin
 * @Date: 2022-03-17 16:05:38
 * @LastEditors: nevin
 * @LastEditTime: 2025-01-23 22:46:37
 * @Description: 表格状数据
 */

import { PubStatus } from '../db/models/pubRecord';
import { PubType } from '../../commont/publish/PublishEnum';

export interface CorrectQuery {
  page_size: number;
  page_no: number;
}

export interface pubRecordListQuery {
  time?: [string, string];
  status?: PubStatus;
  type?: PubType;
}

export interface CorrectResponse<T> {
  list: T[];
  total_count: number;
  total_page: number;
  page_size: number;
  page_no: number;
}

/**
 * 返回分页数据
 * @param list 列表
 * @param totalCount 总数
 * @param page 分页参数
 * @returns 分页数据
 */
export function backPageData<T>(
  list: T[],
  totalCount: number,
  page: CorrectQuery,
): CorrectResponse<T> {
  return {
    list,
    total_count: totalCount,
    total_page: Math.ceil(totalCount / page.page_size),
    page_size: page.page_size,
    page_no: page.page_no,
  };
}

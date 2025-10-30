/*
 * @Author: nevin
 * @Date: 2025-01-20 16:36:41
 * @LastEditTime: 2025-02-22 17:47:03
 * @LastEditors: nevin
 * @Description: 
 */
import { IPaginationMeta } from './interface';

export class Pagination<T> {
  constructor(
    public readonly items: T[],
    public readonly meta: IPaginationMeta,
  ) {}
}

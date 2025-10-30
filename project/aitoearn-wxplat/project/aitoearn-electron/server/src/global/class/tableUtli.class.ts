/*
 * @Author: nevin
 * @Date: 2024-10-09 17:08:55
 * @LastEditTime: 2024-10-10 15:46:56
 * @LastEditors: nevin
 * @Description:
 */
import { TableDto } from '../dto/table.dto';

export class TableUtil {
  // 获取分页信息
  static GetSqlPaging(paging: TableDto) {
    if (!paging) return {};

    return {
      skip: (paging.pageNo - 1) * paging.pageSize || 0,
      take: paging.pageSize,
    };
  }
}

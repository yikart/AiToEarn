import { TableDto } from '../dto/table.dto'

export class TableUtil {
  static GetSqlPaging(paging: TableDto) {
    if (!paging)
      return {}

    return {
      skip: (paging.pageNo! - 1) * paging.pageSize! || 0,
      take: paging.pageSize,
    }
  }
}

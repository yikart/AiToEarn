import { CorrectResponse } from '../interface/table.interface';
export class ResponseUtil {
  static GetCorrectResponse<T>(
    pageNo: number,
    pageSize: number,
    count: number,
    list: T[],
  ): CorrectResponse<T> {
    return {
      pageNo,
      pageSize,
      count,
      list,
    };
  }
}

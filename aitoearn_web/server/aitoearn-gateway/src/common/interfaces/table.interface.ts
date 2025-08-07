export interface CorrectResponse<T> {
  list: T[]
  pageSize: number
  pageNo: number
  count: number
}

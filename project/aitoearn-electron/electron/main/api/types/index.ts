// 通用响应类型
export interface ResOp<T = any> {
  data: T;
  code?: number;
  message?: string;
}

// 分页元数据
export interface PaginationMeta {
  itemCount: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

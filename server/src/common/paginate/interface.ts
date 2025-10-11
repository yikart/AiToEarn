export enum PaginationTypeEnum {
  LIMIT_AND_OFFSET = 'limit',
  TAKE_AND_SKIP = 'take',
}

export interface IPaginationOptions {
  page: number;
  pageSize: number;
  paginationType?: PaginationTypeEnum;
}

export interface IPaginationMeta {
  itemCount: number;
  totalItems?: number;
  itemsPerPage: number;
  totalPages?: number;
  currentPage: number;
}

export interface IPaginationLinks {
  first?: string;
  previous?: string;
  next?: string;
  last?: string;
}

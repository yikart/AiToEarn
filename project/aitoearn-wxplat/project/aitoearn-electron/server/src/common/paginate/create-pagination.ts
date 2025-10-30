/*
 * @Author: nevin
 * @Date: 2025-01-20 16:36:41
 * @LastEditTime: 2025-02-22 17:43:47
 * @LastEditors: nevin
 * @Description:
 */
import { Model } from 'mongoose';
import {
  IPaginationMeta,
  IPaginationOptions,
  PaginationTypeEnum,
} from './interface';
import { Pagination } from './pagination';

const DEFAULT_LIMIT = 20;
const DEFAULT_PAGE = 1;

export function resolveOptions(
  options: IPaginationOptions,
): [number, number, PaginationTypeEnum] {
  const { page, pageSize, paginationType } = options;

  return [
    page || DEFAULT_PAGE,
    pageSize || DEFAULT_LIMIT,
    paginationType || PaginationTypeEnum.TAKE_AND_SKIP,
  ];
}

export function createPaginationObject<T>({
  items,
  totalItems,
  currentPage,
  limit,
}: {
  items: T[];
  totalItems?: number;
  currentPage: number;
  limit: number;
}): Pagination<T> {
  const totalPages =
    totalItems !== undefined ? Math.ceil(totalItems / limit) : undefined;

  const meta: IPaginationMeta = {
    totalItems,
    itemCount: items.length,
    itemsPerPage: +limit,
    totalPages,
    currentPage: +currentPage,
  };

  return new Pagination<T>(items, meta);
}

export async function paginateModel<T>(
  model: Model<T>,
  options: IPaginationOptions,
  condition: any,
  populate?: any,
  sort?: any,
): Promise<Pagination<T>> {
  const [page, limit] = resolveOptions(options);

  const promises: [Promise<T[]>, Promise<number> | undefined] = [
    model
      .find(condition)
      .skip(limit * (page - 1))
      .limit(limit)
      .populate(populate)
      .sort(sort),
    model.countDocuments(condition),
  ];

  const [items, total] = await Promise.all(promises);

  return createPaginationObject<T>({
    items,
    totalItems: total,
    currentPage: page,
    limit,
  });
}

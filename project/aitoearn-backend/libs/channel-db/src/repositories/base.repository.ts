import { Pagination } from '@yikart/common'
import { DeleteOptions } from 'mongodb'
import {
  FilterQuery,
  FlattenMaps,
  Model,
  MongooseBaseQueryOptions,
  QueryOptions,
  Require_id,
  UpdateQuery,
} from 'mongoose'

export type LeanDoc<T> = FlattenMaps<Require_id<T>>

export interface PaginationParams<TDocument> extends Pagination {
  filter?: FilterQuery<TDocument>
  options?: QueryOptions<TDocument>
}

export type CreateDocumentType<TDocument> = Partial<TDocument>

export type UpdateDocumentType<TDocument> = UpdateQuery<TDocument>

export class BaseRepository<TDocument> {
  constructor(
    protected readonly model: Model<TDocument>,
  ) {}

  /**
   * 根据ID获取单个文档
   */
  async getById(id: string, options?: QueryOptions<TDocument>): Promise<LeanDoc<TDocument> | null> {
    return await this.model.findById(id, undefined, options).lean({ virtuals: true }).exec() as LeanDoc<TDocument> | null
  }

  /**
   * 创建新文档
   */
  async create(data: CreateDocumentType<TDocument>): Promise<LeanDoc<TDocument>> {
    const created = new this.model(data)
    const saved = await created.save()
    return saved.toObject() as LeanDoc<TDocument>
  }

  /**
   * 批量创建文档
   */
  async createMany(data: CreateDocumentType<TDocument>[]): Promise<LeanDoc<TDocument>[]> {
    const docs = await this.model.insertMany(data, { lean: true })
    return docs.map(doc => ({ ...doc, id: String(doc._id) })) as unknown as LeanDoc<TDocument>[]
  }

  /**
   * 根据ID更新文档
   */
  async updateById(
    id: string,
    update: UpdateDocumentType<TDocument>,
    options?: QueryOptions<TDocument>,
  ): Promise<LeanDoc<TDocument> | null> {
    return await this.model.findByIdAndUpdate(id, update, { new: true, ...options }).lean({ virtuals: true }).exec() as LeanDoc<TDocument> | null
  }

  /**
   * 更新单个文档
   */
  protected async updateOne(
    filter: FilterQuery<TDocument>,
    update: UpdateDocumentType<TDocument>,
    options?: QueryOptions<TDocument>,
  ): Promise<LeanDoc<TDocument> | null> {
    return await this.model.findOneAndUpdate(filter, update, { new: true, ...options }).lean({ virtuals: true }).exec() as LeanDoc<TDocument> | null
  }

  /**
   * 根据ID删除文档
   */
  async deleteById(id: string, options?: QueryOptions<TDocument>): Promise<LeanDoc<TDocument> | null> {
    return await this.model.findByIdAndDelete(id, options).lean({ virtuals: true }).exec() as LeanDoc<TDocument> | null
  }

  /**
   * 删除单个文档
   */
  protected async deleteOne(filter: FilterQuery<TDocument>, options?: (DeleteOptions & MongooseBaseQueryOptions<TDocument>)) {
    return await this.model.deleteOne(filter, options).exec()
  }

  /**
   * 批量删除文档
   */
  protected async deleteMany(filter: FilterQuery<TDocument>): Promise<void> {
    await this.model.deleteMany(filter).exec()
  }

  /**
   * 分页查询
   */
  protected async findWithPagination(params: PaginationParams<TDocument>): Promise<readonly [LeanDoc<TDocument>[], number]> {
    const { page, pageSize, filter = {}, options = {} } = params
    const skip = (page - 1) * pageSize

    const findOptions = { ...options, skip, limit: pageSize }

    const [items, total] = await Promise.all([
      this.model.find(filter, undefined, findOptions).lean({ virtuals: true }).exec() as Promise<LeanDoc<TDocument>[]>,
      this.model.countDocuments(filter).exec(),
    ])

    return [items, total] as const
  }

  /**
   * 查找单个文档
   */
  protected async findOne(filter: FilterQuery<TDocument>, options?: QueryOptions<TDocument>): Promise<LeanDoc<TDocument> | null> {
    return await this.model.findOne(filter, undefined, options).lean({ virtuals: true }).exec() as LeanDoc<TDocument> | null
  }

  /**
   * 查找多个文档
   */
  protected async find(filter: FilterQuery<TDocument> = {}, options?: QueryOptions<TDocument>): Promise<LeanDoc<TDocument>[]> {
    return await this.model.find(filter, undefined, options).lean({ virtuals: true }).exec() as LeanDoc<TDocument>[]
  }

  /**
   * 统计文档数量
   */
  protected async count(filter: FilterQuery<TDocument> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec()
  }

  /**
   * 检查文档是否存在
   */
  protected async exists(filter: FilterQuery<TDocument>): Promise<boolean> {
    const result = await this.model.exists(filter).exec()
    return result !== null
  }
}

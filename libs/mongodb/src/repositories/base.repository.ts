import { Pagination } from '@yikart/common'
import { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose'

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
  async getById(id: string, options?: QueryOptions<TDocument>) {
    return await this.model.findById(id, undefined, options).exec()
  }

  /**
   * 创建新文档
   */
  async create(data: CreateDocumentType<TDocument>) {
    const created = new this.model(data)
    return await created.save()
  }

  /**
   * 批量创建文档
   */
  async createMany(data: CreateDocumentType<TDocument>[]) {
    return await this.model.insertMany(data)
  }

  /**
   * 根据ID更新文档
   */
  async updateById(
    id: string,
    update: UpdateDocumentType<TDocument>,
    options?: QueryOptions<TDocument>,
  ) {
    return await this.model.findByIdAndUpdate(id, update, { new: true, ...options }).exec()
  }

  /**
   * 更新单个文档
   */
  protected async updateOne(
    filter: FilterQuery<TDocument>,
    update: UpdateDocumentType<TDocument>,
    options?: QueryOptions<TDocument>,
  ) {
    return await this.model.findOneAndUpdate(filter, update, { new: true, ...options }).exec()
  }

  /**
   * 根据ID删除文档
   */
  async deleteById(id: string, options?: QueryOptions<TDocument>) {
    return await this.model.findByIdAndDelete(id, options).exec()
  }

  /**
   * 删除单个文档
   */
  protected async deleteOne(filter: FilterQuery<TDocument>, options?: QueryOptions<TDocument>) {
    return await this.model.findOneAndDelete(filter, options).exec()
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
  protected async findWithPagination(params: PaginationParams<TDocument>) {
    const { page, pageSize, filter = {}, options = {} } = params
    const skip = (page - 1) * pageSize

    const findOptions = { ...options, skip, limit: pageSize }

    const [items, total] = await Promise.all([
      this.model.find(filter, undefined, findOptions).exec(),
      this.model.countDocuments(filter).exec(),
    ])

    return [items, total] as const
  }

  /**
   * 查找单个文档
   */
  protected async findOne(filter: FilterQuery<TDocument>, options?: QueryOptions<TDocument>) {
    return await this.model.findOne(filter, undefined, options).exec()
  }

  /**
   * 查找多个文档
   */
  protected async find(filter: FilterQuery<TDocument> = {}, options?: QueryOptions<TDocument>) {
    return await this.model.find(filter, undefined, options).exec()
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

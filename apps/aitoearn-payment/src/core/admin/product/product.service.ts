/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { TableDto } from '@yikart/common'
import { Product } from '@yikart/mongodb'
import { ProductService } from '@yikart/stripe'
import { Model } from 'mongoose'

@Injectable()
export class AdminProductService {
  private readonly logger = new Logger(AdminProductService.name)

  constructor(
    private readonly productApiService: ProductService,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {
  }

  // 获取产品信息
  async getProductById(id: string) {
    const result = await this.productModel.findById(id)
    this.logger.log(result)
    return result
    // return this.productModule.findOneAndUpdate({ id }, product)
  }

  // 创建产品
  async create(body: any) {
    const result = await this.productApiService.create(body)
      .catch((e) => {
        throw new BadRequestException(`创建产品失败${e.message()} `)
      })
    const { id, images, active, name } = result
    let product = { id, images, active, name }
    product = await this.productModel.findOneAndUpdate({ id }, product, { upsert: true, new: true })
    return product
  }

  // 更新产品
  async modify(id: string, body: any) {
    const result = await this.productApiService.modify(id, body)
      .catch((e) => {
        throw new BadRequestException(`更新产品失败${e.message()} `)
      })
    const { images, active, name } = result
    let product = { id, images, active, name }
    product = await this.productModel.findOneAndUpdate({ id }, product, { upsert: true, new: true })
    return product
    // return this.productModule.findOneAndUpdate({ id: product.id }, product)
  }

  // 产品列表
  async list(page: TableDto) {
    const result = await this.productModel.find(
      {},
      {},
      {
        skip: (page.pageNo - 1) * page.pageSize,
        limit: page.pageSize,
      },
    )

    return {
      total: await this.productModel.countDocuments(),
      list: result,
    }
  }
}

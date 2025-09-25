/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Product } from '@yikart/mongodb'
import { StripeService } from '@yikart/stripe'
import { Model } from 'mongoose'
import { ProductDto } from './product.dto'

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name)

  constructor(
    private readonly stripeService: StripeService,
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
  async create(body: ProductDto) {
    const result = await this.stripeService.product.create(body)
      .catch((e) => {
        throw new BadRequestException(`创建产品失败${e.message()} `)
      })
    const { id, images, active, name } = result
    let product = { id, images, active, name }
    product = await this.productModel.findOneAndUpdate({ id }, product, { upsert: true, new: true })
    return product
  }

  // 更新产品
  async modify(id: string, body: ProductDto) {
    const result = await this.stripeService.product.modify(id, body)
      .catch((e) => {
        throw new BadRequestException(`更新产品失败${e.message()} `)
      })
    const { images, active, name } = result
    let product = { id, images, active, name }
    product = await this.productModel.findOneAndUpdate({ id }, product, { upsert: true, new: true })
    return product
    // return this.productModule.findOneAndUpdate({ id: product.id }, product)
  }
}

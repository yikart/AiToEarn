/*
 * @Author: white
 * @Date: 2025-06-25 16:12:27
 * @LastEditTime: 2025-06-26 09:47:37
 * @LastEditors: white
 * @Description: product
 */
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { TableDto } from '@yikart/common'
import { ProductRepository } from '@yikart/mongodb'
import { ProductService } from '@yikart/stripe'

@Injectable()
export class AdminProductService {
  private readonly logger = new Logger(AdminProductService.name)

  constructor(
    private readonly productApiService: ProductService,
    private readonly productRepository: ProductRepository,
  ) {
  }

  // 获取产品信息
  async getProductById(id: string) {
    const result = await this.productRepository.getById(id)
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
    const product = { id, images, active, name }
    const savedProduct = await this.productRepository.upsertById(id, product)
    return savedProduct
  }

  // 更新产品
  async modify(id: string, body: any) {
    const result = await this.productApiService.modify(id, body)
      .catch((e) => {
        throw new BadRequestException(`更新产品失败${e.message()} `)
      })
    const { images, active, name } = result
    const product = { id, images, active, name }
    const savedProduct = await this.productRepository.upsertById(id, product)
    return savedProduct
    // return this.productModule.findOneAndUpdate({ id: product.id }, product)
  }

  // 产品列表
  async list(page: TableDto) {
    const [list, total] = await this.productRepository.listWithPagination({
      page: page.pageNo,
      pageSize: page.pageSize,
    })

    return {
      total,
      list,
    }
  }
}
